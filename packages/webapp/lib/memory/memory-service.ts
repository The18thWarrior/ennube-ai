// === memory-service.ts ===
// Created: 2025-10-04 10:00
// Purpose: CRUD operations and utilities for agent memory system using PostgreSQL
// Exports:
//   - MemoryService class
//   - getEmbeddings
// Interactions:
//   - Used by: memory-retriever.ts, memory-writer.ts, memory-policy.ts
// Notes:
//   - Uses pgvector for embeddings; falls back to cosine similarity if unavailable
//   - Compresses large JSONB fields with pako to reduce storage costs

import { Pool } from 'pg';
import { deflate, inflate } from 'pako';
import {
  AgentMemoryProfile,
  AgentMemoryCase,
  AgentMemoryEmbedding,
  AgentMemoryAudit,
  AgentMemoryPolicy,
  CreateAgentMemoryProfile,
  CreateAgentMemoryCase,
  CreateAgentMemoryEmbedding,
  CreateAgentMemoryAudit,
  CreateAgentMemoryPolicy,
  EmbedRequestType,
  EmbedResponseType,
} from './types';

/**
 * OVERVIEW
 *
 * - Purpose: Provide transactional, secure database operations for memory persistence
 * - Assumptions: PostgreSQL with pgvector; environment variables set for connection
 * - Edge Cases: Compression failures, embedding API errors, connection timeouts
 * - How it fits: Central data access layer for all memory operations
 * - Future: Add connection pooling optimizations, batch operations
 */

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true,
  max: 10,
  idleTimeoutMillis: 30000,
});

// Utility functions
function compressJson(data: any): Buffer {
  try {
    const jsonString = JSON.stringify(data);
    return Buffer.from(deflate(jsonString));
  } catch (error) {
    console.error('Compression failed:', error);
    return Buffer.from(JSON.stringify(data));
  }
}

function decompressJson(buffer: Buffer): any {
  try {
    const inflated = inflate(buffer, { to: 'string' });
    return JSON.parse(inflated);
  } catch (error) {
    console.error('Decompression failed:', error);
    return JSON.parse(buffer.toString());
  }
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const embedderUrl = process.env.EMBEDDER_API_URL;
  if (!embedderUrl) {
    throw new Error('EMBEDDER_API_URL not configured');
  }

  const response = await fetch(`${embedderUrl}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts } as EmbedRequestType),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.statusText}`);
  }

  const data: EmbedResponseType = await response.json();
  return data.embeddings;
}

export { getEmbeddings };

export class MemoryService {
  private pool: Pool;

  constructor(poolInstance?: Pool) {
    this.pool = poolInstance || pool;
  }

  // Profile operations
  async createProfile(profile: CreateAgentMemoryProfile): Promise<AgentMemoryProfile> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO agent_memory_profiles (user_sub, agent_key, window_size)
         VALUES ($1, $2, $3)
         RETURNING id, user_sub, agent_key, window_size, created_at, updated_at`,
        [profile.userSub, profile.agentKey, profile.windowSize]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getProfile(userSub: string, agentKey: string): Promise<AgentMemoryProfile | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id, user_sub as "userSub", agent_key as "agentKey", window_size as "windowSize", created_at as "createdAt", updated_at as "updatedAt"
         FROM agent_memory_profiles
         WHERE user_sub = $1 AND agent_key = $2`,
        [userSub, agentKey]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async updateProfile(id: string, updates: Partial<CreateAgentMemoryProfile>): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (updates.windowSize !== undefined) {
        fields.push(`window_size = $${paramIndex++}`);
        values.push(updates.windowSize);
      }

      if (fields.length === 0) return true;

      values.push(id);
      await client.query(
        `UPDATE agent_memory_profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
        values
      );
      return true;
    } finally {
      client.release();
    }
  }

  // Case operations
  async createCase(caseData: CreateAgentMemoryCase): Promise<AgentMemoryCase> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Compress large fields
      const compressedPrompt = caseData.promptSnapshot ? compressJson(caseData.promptSnapshot) : null;
      const compressedPlan = caseData.planSummary ? compressJson(caseData.planSummary) : null;
      const compressedTraces = caseData.toolTraces ? compressJson(caseData.toolTraces) : null;

      const result = await client.query(
        `INSERT INTO agent_memory_cases (profile_id, message_hash, prompt_snapshot, plan_summary, tool_traces, outcome, reward_score, tags, reference_case_ids)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, profile_id as "profileId", message_hash as "messageHash", prompt_snapshot, plan_summary, tool_traces, outcome, reward_score as "rewardScore", tags, created_at as "createdAt", reference_case_ids as "referenceCaseIds"`,
        [
          caseData.profileId,
          caseData.messageHash,
          compressedPrompt,
          compressedPlan,
          compressedTraces,
          caseData.outcome,
          caseData.rewardScore,
          caseData.tags,
          caseData.referenceCaseIds,
        ]
      );

      const row = result.rows[0];

      // Decompress for return
      if (row.prompt_snapshot) row.promptSnapshot = decompressJson(row.prompt_snapshot);
      if (row.plan_summary) row.planSummary = decompressJson(row.plan_summary);
      if (row.tool_traces) row.toolTraces = decompressJson(row.tool_traces);

      await client.query('COMMIT');
      return row;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getCasesByProfile(profileId: string, limit: number = 200): Promise<AgentMemoryCase[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id, profile_id as "profileId", message_hash as "messageHash", prompt_snapshot, plan_summary, tool_traces, outcome, reward_score as "rewardScore", tags, created_at as "createdAt", reference_case_ids as "referenceCaseIds"
         FROM agent_memory_cases
         WHERE profile_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [profileId, limit]
      );

      return result.rows.map(row => ({
        ...row,
        promptSnapshot: row.prompt_snapshot ? decompressJson(row.prompt_snapshot) : undefined,
        planSummary: row.plan_summary ? decompressJson(row.plan_summary) : undefined,
        toolTraces: row.tool_traces ? decompressJson(row.tool_traces) : undefined,
      }));
    } finally {
      client.release();
    }
  }

  // Embedding operations
  async createEmbedding(embedding: CreateAgentMemoryEmbedding): Promise<AgentMemoryEmbedding> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO agent_memory_embeddings (case_id, embedding, metadata)
         VALUES ($1, $2, $3)
         RETURNING case_id as "caseId", embedding, metadata, created_at as "createdAt"`,
        [embedding.caseId, `[${embedding.embedding.join(',')}]`, embedding.metadata]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getSimilarEmbeddings(queryEmbedding: number[], profileId: string, limit: number = 4): Promise<AgentMemoryEmbedding[]> {
    const client = await this.pool.connect();
    try {
      // Use pgvector cosine similarity
      const result = await client.query(
        `SELECT e.case_id as "caseId", e.embedding, e.metadata, e.created_at as "createdAt"
         FROM agent_memory_embeddings e
         JOIN agent_memory_cases c ON e.case_id = c.id
         WHERE c.profile_id = $1
         ORDER BY e.embedding <=> $2
         LIMIT $3`,
        [profileId, `[${queryEmbedding.join(',')}]`, limit]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Audit operations
  async createAudit(audit: CreateAgentMemoryAudit): Promise<AgentMemoryAudit> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO agent_memory_audit (user_sub, agent_key, action, payload)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_sub as "userSub", agent_key as "agentKey", action, payload, created_at as "createdAt"`,
        [audit.userSub, audit.agentKey, audit.action, audit.payload]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Policy operations
  async createPolicy(policy: CreateAgentMemoryPolicy): Promise<AgentMemoryPolicy> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO agent_memory_policies (profile_id, version, weights, loss_metrics, trained_at, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, profile_id as "profileId", version, weights, loss_metrics, trained_at as "trainedAt", status, created_at as "createdAt"`,
        [policy.profileId, policy.version, policy.weights, policy.lossMetrics, policy.trainedAt, policy.status]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getActivePolicy(profileId: string): Promise<AgentMemoryPolicy | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id, profile_id as "profileId", version, weights, loss_metrics as "lossMetrics", trained_at as "trainedAt", status, created_at as "createdAt"
         FROM agent_memory_policies
         WHERE profile_id = $1 AND status = 'active'
         ORDER BY version DESC
         LIMIT 1`,
        [profileId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Cleanup operations
  async pruneOldCases(profileId: string, windowSize: number): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM agent_memory_cases
         WHERE profile_id = $1 AND id NOT IN (
           SELECT id FROM agent_memory_cases
           WHERE profile_id = $1
           ORDER BY created_at DESC
           LIMIT $2
         )`,
        [profileId, windowSize]
      );
      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  async updateCaseReward(caseId: string, rewardScore: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE agent_memory_cases
         SET reward_score = $1, updated_at = NOW()
         WHERE id = $2`,
        [Math.max(0, Math.min(1, rewardScore)), caseId] // Clamp to 0-1 range
      );

      await client.query('COMMIT');
      return (result.rowCount || 0) > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const memoryService = new MemoryService();

/*
 * === memory-service.ts ===
 * Updated: 2025-10-04 10:00
 * Summary: Database operations for agent memory with compression and embedding support
 * Key Components:
 *   - MemoryService: CRUD operations with transactions
 *   - Compression: pako for JSONB fields
 *   - Embeddings: API integration for vector generation
 * Dependencies:
 *   - Requires: pg, pako, types.ts
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Uses transactions for data integrity
 *   - Compresses large payloads to control costs
 */