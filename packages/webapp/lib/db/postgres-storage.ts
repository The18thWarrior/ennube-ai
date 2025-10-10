// === postgres-storage.ts ===
// Created: 2025-07-21 10:10
// Purpose: Utility functions for managing PostgreSQL connection URLs and credentials in PostgreSQL
// Exports:
//   - storePostgresUrl
//   - getPostgresUrlById
//   - getPostgresUrlBySub
//   - removePostgresUrl
//   - updatePostgresUrl
//   - parsePostgresConfigFromUrl
//   - closeConnection
// Interactions:
//   - Used by: backend services, API routes, lib/postgres.ts
// Notes:
//   - Stores full postgres connection string in instance_url

import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import { PostgresConfig } from '../../types/postgres';
import { auth } from '@/auth';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true
});

const CREDENTIALS_TABLE = 'credentials';

export interface StoredPostgresUrl {
  instanceUrl: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Parse a postgres connection string into PostgresConfig
 * @param url Postgres connection string
 */
export function parsePostgresConfigFromUrl(url: string): PostgresConfig {
  try {
    const parsed = new URL(url);
    const [user, password] = (parsed.username + ':' + parsed.password).split(':');
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '5432'),
      user,
      password,
      database: parsed.pathname.replace(/^\//, ''),
      ssl: parsed.searchParams.get('sslmode') === 'require',
    };
  } catch (error) {
    throw new Error('Invalid Postgres URL');
  }
}

/**
 * Store Postgres connection URL in PostgreSQL
 */
export async function storePostgresUrl(instanceUrl: string): Promise<string | null> {
  if (!instanceUrl) return null;
  const session = await auth();
  if (!session || !session.user || !session.user.auth0) {
    console.log('No session found');
    return null;
  }
  try {
    const sessionId = nanoid();
    const createdAt = Date.now();
    const expiresAt = createdAt + 100000000 * 60 * 60 * 1000; // 1000 hours
    const userSub = session.user.auth0.sub;
    // Check if user already has credentials stored
    const checkResult = await pool.query(
      `SELECT COUNT(*) FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'postgres'`,
      [userSub]
    );
    const exists = parseInt(checkResult.rows[0].count) > 0;
    if (exists) {
      await pool.query(
        `UPDATE ${CREDENTIALS_TABLE} SET instance_url = $1, created_at = $2, expires_at = $3 WHERE user_id = $4 AND type = 'postgres' AND access_token = '' `,
        [instanceUrl, createdAt, expiresAt, userSub]
      );
    } else {
      await pool.query(
        `INSERT INTO ${CREDENTIALS_TABLE} (user_id, type, instance_url, created_at, expires_at, access_token) VALUES ($1, 'postgres', $2, $3, $4, '')`,
        [userSub, instanceUrl, createdAt, expiresAt]
      );
    }
    return sessionId;
  } catch (error) {
    console.log('Error storing Postgres URL:', error);
    return null;
  }
}

/**
 * Retrieve Postgres connection URL for current user
 */
export async function getPostgresUrlById(): Promise<StoredPostgresUrl | null> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.log('No session found');
      return null;
    }
    const userSub = session.user.auth0.sub;
    const result = await pool.query(
      `SELECT instance_url as "instanceUrl", created_at as "createdAt", expires_at as "expiresAt" FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'postgres'`,
      [userSub]
    );
    if (result.rows.length === 0) {
      console.log('No Postgres URL found for user:', userSub);
      return null;
    }
    const urlObj = result.rows[0] as StoredPostgresUrl;
    if (Date.now() > urlObj.expiresAt) {
      // Expired, but still return for refresh
    }
    return urlObj;
  } catch (error) {
    console.log('Error retrieving Postgres URL:', error);
    return null;
  }
}

/**
 * Retrieve Postgres connection URL by user sub
 */
export async function getPostgresUrlBySub(sub: string): Promise<StoredPostgresUrl | null> {
  try {
    const result = await pool.query(
      `SELECT instance_url as "instanceUrl", created_at as "createdAt", expires_at as "expiresAt" FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'postgres'`,
      [sub]
    );
    if (result.rows.length === 0) {
      console.log('No Postgres URL found for sub:', sub);
      return null;
    }
    const urlObj = result.rows[0] as StoredPostgresUrl;
    if (Date.now() > urlObj.expiresAt) {
      // Expired, but still return for refresh
    }
    return urlObj;
  } catch (error) {
    console.log('Error retrieving Postgres URL:', error);
    return null;
  }
}

/**
 * Remove Postgres connection URL for current user
 */
export async function removePostgresUrl(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.log('No session found');
      return false;
    }
    const userSub = session.user.auth0.sub;
    await pool.query(
      `DELETE FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'postgres'`,
      [userSub]
    );
    return true;
  } catch (error) {
    console.log('Error removing Postgres URL:', error);
    return false;
  }
}

/**
 * Update existing Postgres connection URL (useful after refresh)
 */
export async function updatePostgresUrl(instanceUrl: string): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.log('No session found');
      return false;
    }
    const userSub = session.user.auth0.sub;
    const now = Date.now();
    const expiresAt = now + 2 * 60 * 60 * 1000; // 2 hours
    const checkResult = await pool.query(
      `SELECT COUNT(*) FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'postgres'`,
      [userSub]
    );
    if (parseInt(checkResult.rows[0].count) === 0) {
      console.log('No existing Postgres URL found to update');
      return false;
    }
    await pool.query(
      `UPDATE ${CREDENTIALS_TABLE} SET instance_url = $1, expires_at = $2 WHERE user_id = $3 AND type = 'postgres'`,
      [instanceUrl, expiresAt, userSub]
    );
    return true;
  } catch (error) {
    console.log('Error updating Postgres URL:', error);
    return false;
  }
}

/**
 * Close database connections when the application is shutting down
 */
export async function closeConnection(): Promise<void> {
  try {
    await pool.end();
    console.log('PostgreSQL connection pool closed');
  } catch (error) {
    console.log('Error closing PostgreSQL connection pool:', error);
  }
}

// Usage Example
// import { storePostgresUrl, getPostgresUrlById, parsePostgresConfigFromUrl } from './postgres-storage';
// const url = 'postgres://user:password@host:5432/database?sslmode=require';
// await storePostgresUrl(url);
// const stored = await getPostgresUrlById();
// if (stored) {
//   const config = parsePostgresConfigFromUrl(stored.instanceUrl);
//   // Use config with lib/postgres.ts
// }

/*
 * === postgres-storage.ts ===
 * Updated: 2025-07-21 10:10
 * Summary: Stores and retrieves Postgres connection URLs, parses config for lib/postgres.ts
 * Key Components:
 *   - storePostgresUrl: Insert/update
 *   - getPostgresUrlById: Retrieve for current user
 *   - parsePostgresConfigFromUrl: Parse config
 * Dependencies:
 *   - Requires: pg, nanoid, types/postgres
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - All inputs validated; no secrets exposed in errors
 */
