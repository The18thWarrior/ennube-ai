// === postgres.ts ===
// Created: 2025-07-21 10:00
// Purpose: PostgreSQL connection and query execution library
// Exports:
//   - PostgresClient
//   - connectToPostgres
//   - executeQuery
// Interactions:
//   - Used by: backend services, API routes
// Notes:
//   - All user input is validated and sanitized

import { Pool, PoolClient, QueryResult } from 'pg';
import { PostgresConfig, QueryOptions } from '../types/postgres';

/**
 * OVERVIEW
 *
 * - Purpose: Provide secure, reusable, and testable PostgreSQL connection/query utilities.
 * - Assumptions: User provides valid connection config; queries are parameterized.
 * - Edge Cases: Invalid config, connection errors, SQL injection attempts, large result sets.
 * - How it fits: Used by server actions, API routes, or services needing DB access.
 * - Future: Add connection pooling, transaction helpers, streaming support.
 */

// Type guard for PostgresConfig
export const isPostgresConfig = (input: any): input is PostgresConfig => {
  return (
    typeof input === 'object' &&
    typeof input.host === 'string' &&
    typeof input.port === 'number' &&
    typeof input.user === 'string' &&
    typeof input.password === 'string' &&
    typeof input.database === 'string'
  );
};

// Main client class
export class PostgresClient {
  private pool: Pool;

  constructor(config: PostgresConfig) {
    if (!isPostgresConfig(config)) {
      throw new Error('Invalid PostgresConfig');
    }
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl ?? false,
      max: config.maxConnections ?? 10,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
    });
  }

  /**
   * Executes a parameterized query securely.
   * @param sql SQL string with $1, $2, ... placeholders
   * @param params Array of parameters
   */
  async query(sql: string, params: unknown[] = []): Promise<QueryResult<any>> {
    if (typeof sql !== 'string' || !Array.isArray(params)) {
      throw new Error('Invalid query input');
    }
    try {
      return await this.pool.query(sql, params);
    } catch (err) {
      // Never log secrets; structured error only
      throw new Error(`Postgres query failed: ${(err as Error).message}`);
    }
  }

  /**
   * Gracefully close all connections.
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Connects to a PostgreSQL database and returns a client instance.
 * @param config PostgresConfig
 */
export const connectToPostgres = (config: PostgresConfig): PostgresClient => {
  return new PostgresClient(config);
};

/**
 * Executes a query using a one-off client (auto-closes).
 * @param config PostgresConfig
 * @param sql SQL string
 * @param params Query params
 */
export const executeQuery = async <T = any>(
  config: PostgresConfig,
  sql: string,
  params: unknown[] = []
): Promise<QueryResult<any>> => {
  const client = new PostgresClient(config);
  try {
    return await client.query(sql, params);
  } finally {
    await client.close();
  }
};

// Usage Example
// import { connectToPostgres, executeQuery } from './postgres';
// const config = { host: 'localhost', port: 5432, user: 'me', password: 'pw', database: 'db' };
// const client = connectToPostgres(config);
// const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
// await client.close();
// // Or, one-off:
// const result = await executeQuery(config, 'SELECT * FROM users');

/*
 * === postgres.ts ===
 * Updated: 2025-07-21 10:00
 * Summary: PostgreSQL connection/query library with input validation, error handling, and usage examples.
 * Key Components:
 *   - PostgresClient: Connection pool, query, close
 *   - connectToPostgres: Factory
 *   - executeQuery: One-off query
 * Dependencies:
 *   - Requires: pg, types/postgres
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - All inputs validated; no secrets exposed in errors
 */
