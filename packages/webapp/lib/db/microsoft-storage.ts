// === microsoft-storage.ts ===
// Created: 2025-08-15 00:00
// Purpose: Helpers to read/write Microsoft credentials for a given user in the `credentials` table.

/**
 * OVERVIEW
 * - Purpose: Provide small CRUD methods to store Microsoft OAuth tokens for a user.
 * - Assumptions: There's a `credentials` table with columns matching other providers.
 * - Implementation: Uses an abstracted `db` client (pg or prisma) — adapter to your project's DB client is required.
 */

import { Pool } from 'pg';
import { auth } from '@/auth';

interface StoredCredentialRow {
  id: string;
  user_id: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: Date | null;
  raw: any;
  created_at: Date;
  updated_at: Date;
}

// Create a pool (parity with other storage modules)
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true,
});

const CREDENTIALS_TABLE = 'credentials';

export async function getMicrosoftCredentialsById(): Promise<StoredCredentialRow | null> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.log('No session found');
      return null;
    }
    const userSub = session.user.auth0.sub;
    const result = await pool.query(
      `SELECT * FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND provider = 'microsoft' LIMIT 1`,
      [userSub]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0] as StoredCredentialRow;
  } catch (error) {
    console.log('Error retrieving Microsoft credentials:', error);
    return null;
  }
}

// Per-user functions (can be used by API routes that know the user id)
export async function getMicrosoftCredentialsForUser(userId: string): Promise<StoredCredentialRow | null> {
  const res = await pool.query('SELECT * FROM credentials WHERE user_id = $1 AND provider = $2 LIMIT 1', [userId, 'microsoft']);
  if (res.rowCount === 0) return null;
  return res.rows[0] as StoredCredentialRow;
}

export async function upsertMicrosoftCredentials(userId: string, data: { accessToken?: string | null; refreshToken?: string | null; expiresAt?: number | null; scope?: string; providerUserId?: string | null; raw?: any }): Promise<StoredCredentialRow> {
  const expiresAtDate = data.expiresAt ? new Date(data.expiresAt) : null;
  const upsertQuery = `
    INSERT INTO ${CREDENTIALS_TABLE} (user_id, provider, access_token, refresh_token, expires_at, raw, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    ON CONFLICT (user_id, provider) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      raw = EXCLUDED.raw,
      updated_at = NOW()
    RETURNING *
  `;
  const values = [userId, 'microsoft', data.accessToken || null, data.refreshToken || null, expiresAtDate, data.raw || {}];
  const res = await pool.query(upsertQuery, values);
  return res.rows[0] as StoredCredentialRow;
}

export async function deleteMicrosoftCredentials(userId: string): Promise<void> {
  await pool.query('DELETE FROM credentials WHERE user_id = $1 AND provider = $2', [userId, 'microsoft']);
}

/**
 * Remove Microsoft credentials for current authenticated user
 */
export async function removeMicrosoftCredentials(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.log('No session found');
      return false;
    }
    const userSub = session.user.auth0.sub;
    await pool.query('DELETE FROM credentials WHERE user_id = $1 AND provider = $2', [userSub, 'microsoft']);
    return true;
  } catch (error) {
    console.log('Error removing Microsoft credentials:', error);
    return false;
  }
}

/*
 * === microsoft-storage.ts ===
 * Summary: DB helpers for microsoft credentials. Uses project's auth() to determine current user when needed.
 */
