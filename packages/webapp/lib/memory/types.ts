// === types.ts ===
// Created: 2025-10-04 10:00
// Purpose: Shared TypeScript interfaces for agent memory learning system
// Exports:
//   - AgentMemoryProfile
//   - AgentMemoryCase
//   - AgentMemoryEmbedding
//   - AgentMemoryAudit
//   - AgentMemoryPolicy
//   - MemoryRetrievalResult
//   - MemoryWriteRequest
// Interactions:
//   - Used by: memory-service.ts, memory-retriever.ts, memory-writer.ts, memory-policy.ts
// Notes:
//   - All types validated with Zod schemas for runtime safety

import { z } from 'zod';

/**
 * OVERVIEW
 *
 * - Purpose: Define core data structures for the agent memory system
 * - Assumptions: Data comes from validated sources; embeddings are 1536-dimensional
 * - Edge Cases: Optional fields for backward compatibility; reward scores clamped 0-1
 * - How it fits: Used across memory modules for type safety and API contracts
 * - Future: Add versioning for schema evolution
 */

// Zod schemas for validation
export const AgentMemoryProfileSchema = z.object({
  id: z.string().uuid(),
  userSub: z.string(),
  agentKey: z.string(),
  windowSize: z.number().int().positive().default(200),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AgentMemoryCaseSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  messageHash: z.string(),
  promptSnapshot: z.record(z.any()).optional(),
  planSummary: z.record(z.any()).optional(),
  toolTraces: z.record(z.any()).optional(),
  outcome: z.enum(['success', 'failure', 'partial', 'aborted']),
  rewardScore: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date(),
  referenceCaseIds: z.array(z.string().uuid()).optional(),
});

export const AgentMemoryEmbeddingSchema = z.object({
  caseId: z.string().uuid(),
  embedding: z.array(z.number()).length(1536),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
});

export const AgentMemoryAuditSchema = z.object({
  id: z.number().int().positive(),
  userSub: z.string(),
  agentKey: z.string(),
  action: z.enum(['insert_case', 'update_case', 'prune_case', 'retrieve_cases', 'train_policy']),
  payload: z.record(z.any()),
  createdAt: z.date(),
});

export const AgentMemoryPolicySchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  version: z.number().int().positive(),
  weights: z.record(z.any()).optional(),
  lossMetrics: z.record(z.any()).optional(),
  trainedAt: z.date().optional(),
  status: z.enum(['active', 'training', 'failed']).default('active'),
  createdAt: z.date(),
});

// TypeScript interfaces
export interface AgentMemoryProfile {
  id: string;
  userSub: string;
  agentKey: string;
  windowSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMemoryCase {
  id: string;
  profileId: string;
  messageHash: string;
  promptSnapshot?: Record<string, any>;
  planSummary?: Record<string, any>;
  toolTraces?: Record<string, any>;
  outcome: 'success' | 'failure' | 'partial' | 'aborted';
  rewardScore?: number;
  tags?: string[];
  createdAt: Date;
  referenceCaseIds?: string[];
}

export interface AgentMemoryEmbedding {
  caseId: string;
  embedding: number[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AgentMemoryAudit {
  id: number;
  userSub: string;
  agentKey: string;
  action: 'insert_case' | 'update_case' | 'prune_case' | 'retrieve_cases' | 'train_policy';
  payload: Record<string, any>;
  createdAt: Date;
}

export interface AgentMemoryPolicy {
  id: string;
  profileId: string;
  version: number;
  weights?: Record<string, any>;
  lossMetrics?: Record<string, any>;
  trainedAt?: Date;
  status: 'active' | 'training' | 'failed';
  createdAt: Date;
}

// Additional types for operations
export interface MemoryRetrievalResult {
  cases: AgentMemoryCase[];
  embeddings?: AgentMemoryEmbedding[];
  policyVersion?: number;
  retrievalMetrics: {
    hitRate: number;
    latency: number;
    tokenCount: number;
  };
}

export interface MemoryWriteRequest {
  userSub: string;
  agentKey: string;
  messageHash: string;
  promptSnapshot?: Record<string, any>;
  planSummary?: Record<string, any>;
  toolTraces?: Record<string, any>;
  outcome: 'success' | 'failure' | 'partial' | 'aborted';
  rewardScore?: number;
  tags?: string[];
  referenceCaseIds?: string[];
}

export interface EmbedRequestType {
  texts: string[];
}

export interface EmbedResponseType {
  embeddings: number[][];
}

// Utility types
export type CreateAgentMemoryProfile = Omit<AgentMemoryProfile, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateAgentMemoryCase = Omit<AgentMemoryCase, 'id' | 'createdAt'>;
export type CreateAgentMemoryEmbedding = Omit<AgentMemoryEmbedding, 'createdAt'>;
export type CreateAgentMemoryAudit = Omit<AgentMemoryAudit, 'id' | 'createdAt'>;
export type CreateAgentMemoryPolicy = Omit<AgentMemoryPolicy, 'id' | 'createdAt'>;

/*
 * === types.ts ===
 * Updated: 2025-10-04 10:00
 * Summary: TypeScript interfaces and Zod schemas for agent memory system
 * Key Components:
 *   - AgentMemoryProfile: User-agent configuration
 *   - AgentMemoryCase: Core memory case data
 *   - AgentMemoryEmbedding: Vector embeddings
 *   - AgentMemoryAudit: Operation audit log
 *   - AgentMemoryPolicy: Parametric retrieval policies
 * Dependencies:
 *   - Requires: zod
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - All interfaces have Zod validation for runtime safety
 */