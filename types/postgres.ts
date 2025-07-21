// === postgres.ts ===
// Created: 2025-07-21 10:00
// Purpose: Type definitions for Postgres library
// Exports:
//   - PostgresConfig
// Interactions:
//   - Used by: lib/postgres.ts
// Notes:
//   - Extend as needed for advanced options

/**
 * OVERVIEW
 *
 * - Purpose: Provide type safety for Postgres connection and query options.
 * - Assumptions: All fields required except optional SSL and pool settings.
 * - Edge Cases: Invalid types, missing fields.
 * - How it fits: Used for validation and type guards in PostgresClient.
 * - Future: Add transaction, streaming, advanced pool config.
 */

export interface PostgresConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
}

// Extend for query options if needed
export interface QueryOptions {
  text: string;
  values?: unknown[];
}

/*
 * === postgres.ts ===
 * Updated: 2025-07-21 10:00
 * Summary: Type definitions for Postgres connection and query options.
 * Key Components:
 *   - PostgresConfig: Connection config
 *   - QueryOptions: Query config
 * Dependencies:
 *   - None
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Used by lib/postgres.ts
 */
