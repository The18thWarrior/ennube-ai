// === contract-results-storage.ts ===
// Created: 2025-07-29  
// Purpose: Type-safe, access-controlled storage for contract_results table
// Exports:
//   - getContractResultById
//   - getContractResultBySourceId
//   - listContractResultsByUser
//   - createContractResult
//   - updateContractResult
//   - deleteContractResult
// Interactions:
//   - Used by: API routes, services needing contract extraction results
// Notes:
//   - All queries require user_id for access control

import { Pool, QueryResult } from 'pg';
import { z } from 'zod';
//import { v4 as uuidv4 } from 'uuid';

/**
 * OVERVIEW
 *
 * - Purpose: Provide CRUD access to contract_results table, always user-scoped.
 * - Assumptions: Postgres connection pool provided via PG_URL env var.
 * - Edge Cases: Throws if user_id missing, or record not found for user.
 * - How it fits: Used by backend API/services for contract result storage.
 * - Future: Add pagination, advanced filtering, soft delete, audit logging.
 */

// --- Types ---


/**
 * Provider enum as string literal type and Zod schema
 */
export const PROVIDERS = ['sfdc', 'hubspot', 'gmail', 'msoffice'] as const;
export type Provider = typeof PROVIDERS[number];
export const ProviderEnum = z.enum(PROVIDERS);


// ContractResult: allow any shape, but must be an object (JSONB)
export const ContractResultSchema = z.record(z.unknown());

export type ContractResult = z.infer<typeof ContractResultSchema>;


/**
 * TypeScript type for a row in contract_results table
 */
export interface ContractResultsRow {
  id: string; // UUID
  user_id: string; // VARCHAR(64)
  created_at: string; // TIMESTAMP (ISO string)
  updated_at: number; // BIGINT (epoch ms)
  source_id: string; // VARCHAR(128)
  provider: Provider; // enum
  contract_data: ContractResult; // JSONB
}

// --- DB Setup ---

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true
});

// --- Helper ---
function requireUserId(user_id: string) {
  if (!user_id) throw new Error('user_id is required for all contract_results queries');
}

// --- CRUD Methods ---

/**
 * Get a contract result by id (user-scoped)
 */
export async function getContractResultById(id: string, user_id: string): Promise<ContractResultsRow | null> {
  requireUserId(user_id);
  const q = `SELECT * FROM contract_results WHERE id = $1 AND user_id = $2 LIMIT 1`;
  const { rows } = await pool.query(q, [id, user_id]);
  if (!rows[0]) return null;
  rows[0].provider = ProviderEnum.parse(rows[0].provider);
  rows[0].contract_data = ContractResultSchema.parse(rows[0].contract_data);
  return rows[0] as ContractResultsRow;
}

/**
 * Get a contract result by source_id (user-scoped)
 */
export async function getContractResultBySourceId(source_id: string, user_id: string): Promise<ContractResultsRow | null> {
  requireUserId(user_id);
  const q = `SELECT * FROM contract_results WHERE source_id = $1 AND user_id = $2 LIMIT 1`;
  const { rows } = await pool.query(q, [source_id, user_id]);
  if (!rows[0]) return null;
  rows[0].provider = ProviderEnum.parse(rows[0].provider);
  rows[0].contract_data = ContractResultSchema.parse(rows[0].contract_data);
  return rows[0] as ContractResultsRow;
}

/**
 * List all contract results for a user
 */
export async function listContractResultsByUser(user_id: string): Promise<ContractResultsRow[]> {
  requireUserId(user_id);
  const q = `SELECT * FROM contract_results WHERE user_id = $1 ORDER BY created_at DESC`;
  const { rows } = await pool.query(q, [user_id]);
  return rows.map(row => ({
    ...row,
    provider: ProviderEnum.parse(row.provider),
    contract_data: ContractResultSchema.parse(row.contract_data),
  })) as ContractResultsRow[];
}

/**
 * Create a new contract result (user-scoped)
 */
export async function createContractResult(input: Omit<ContractResultsRow, 'id' | 'created_at'>): Promise<ContractResultsRow> {
  requireUserId(input.user_id);
  const created_at = new Date().toISOString();
  const updated_at = Date.now();
  const provider = ProviderEnum.parse(input.provider as Provider);
  const contract_data = ContractResultSchema.parse(input.contract_data);
  const q = `INSERT INTO contract_results (user_id, created_at, updated_at, source_id, provider, contract_data) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
  const { rows } = await pool.query(q, [input.user_id, created_at, updated_at, input.source_id, provider, contract_data]);
  rows[0].provider = provider;
  rows[0].contract_data = contract_data;
  return rows[0] as ContractResultsRow;
}

/**
 * Update a contract result (user-scoped, by id)
 */
export async function updateContractResult(id: string, user_id: string, patch: Partial<Omit<ContractResultsRow, 'id' | 'user_id' | 'created_at'>>): Promise<ContractResultsRow | null> {
  requireUserId(user_id);
  const fields = [];
  const values: any[] = [];
  let idx = 3;
  if (patch.updated_at) { fields.push(`updated_at = $${idx++}`); values.push(patch.updated_at); }
  if (patch.source_id) { fields.push(`source_id = $${idx++}`); values.push(patch.source_id); }
  if (patch.provider) { fields.push(`provider = $${idx++}`); values.push(ProviderEnum.parse(patch.provider as Provider)); }
  if (patch.contract_data) { fields.push(`contract_data = $${idx++}`); values.push(ContractResultSchema.parse(patch.contract_data)); }
  if (!fields.length) throw new Error('No updatable fields provided');
  const q = `UPDATE contract_results SET ${fields.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`;
  const { rows } = await pool.query(q, [id, user_id, ...values]);
  if (!rows[0]) return null;
  rows[0].provider = ProviderEnum.parse(rows[0].provider);
  rows[0].contract_data = ContractResultSchema.parse(rows[0].contract_data);
  return rows[0] as ContractResultsRow;
}

/**
 * Delete a contract result (user-scoped, by id)
 */
export async function deleteContractResult(id: string, user_id: string): Promise<boolean> {
  requireUserId(user_id);
  const q = `DELETE FROM contract_results WHERE id = $1 AND user_id = $2`;
  const { rowCount } = await pool.query(q, [id, user_id]);
  return !!rowCount && rowCount > 0;
}

// --- Usage Example ---
/**
import { getContractResultById } from './contract-results-storage';

const result = await getContractResultById('uuid', 'user-123');
if (!result) throw new Error('Not found');
console.log(result.contract_data);
*/

/*
 * === contract-results-storage.ts ===
 * Updated: 2025-07-29
 * Summary: Type-safe, user-scoped storage for contract_results table
 * Key Components:
 *   - getContractResultById: Fetch by id/user
 *   - getContractResultBySourceId: Fetch by source_id/user
 *   - listContractResultsByUser: List all for user
 *   - createContractResult: Insert new
 *   - updateContractResult: Patch fields
 *   - deleteContractResult: Remove by id/user
 * Dependencies:
 *   - pg, zod, uuid
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - All queries require user_id for access control
 */
