// === api-keys-storage.ts ===
// Created: 2025-08-16
// Purpose: Utility functions for managing api_keys in PostgreSQL
// Exports:
//   - ApiKey
//   - saveApiKey
//   - getApiKey
//   - getUserApiKeys
//   - updateApiKey
//   - deleteApiKey
// Interactions:
//   - Used by: auth, integrations, billing modules
// Notes:
//   - UUID primary key; timestamps maintained via SQL trigger

import { Pool } from 'pg';
import { sha256 } from '../utils';
import crypto from 'crypto';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true
});

export interface ApiKey {
  id?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  hash?: string; // Optional hash for future use
}

/**
 * Save an API key record to PostgreSQL
 */
export async function saveApiKey(record: Omit<ApiKey, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    if (!record.userId || !record.hash) {
      console.log('Cannot save api key: Missing userId or hash');
      return null;
    }
    const now = new Date().toISOString();
    const insertResult = await pool.query(
      `INSERT INTO api_keys (user_id, hash, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING hash`,
      [record.userId, record.hash, now, now]
    );
    return insertResult.rows[0].hash;
  } catch (error) {
    console.log('Error saving api key:', error);
    return null;
  }
}

/**
 * Get an API key record by ID
 */
export async function getApiKey(id: string): Promise<ApiKey | null> {
  try {
    if (!id) {
      console.log('Cannot get api key: No ID provided');
      return null;
    }
    const result = await pool.query(
      `SELECT id, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt" FROM api_keys WHERE id = $1`,
      [id]
    );
    if (result.rows.length > 0) {
      return result.rows[0] as ApiKey;
    }
    return null;
  } catch (error) {
    console.log('Error getting api key:', error);
    return null;
  }
}

/**
 * Get all API keys for a user
 */
export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  try {
    if (!userId) {
      console.log('Cannot get api keys: No userId provided');
      return [];
    }
    const result = await pool.query(
      `SELECT id, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt" FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows as ApiKey[];
  } catch (error) {
    console.log('Error getting user api keys:', error);
    return [];
  }
}

/**
 * Update metadata for an API key (currently only user_id can be changed)
 */
export async function updateApiKey(id: string, updates: Partial<Omit<ApiKey, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
  try {
    if (!id) {
      console.log('Cannot update api key: No ID provided');
      return false;
    }
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    for (const [key, value] of Object.entries(updates)) {
      updateFields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramIndex++}`);
      values.push(value);
    }
    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());
    values.push(id);
    if (updateFields.length === 0) {
      console.warn('No fields to update for api key');
      return false;
    }
    const result = await pool.query(
      `UPDATE api_keys SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id`,
      values
    );
    return result.rows.length > 0;
  } catch (error) {
    console.log('Error updating api key:', error);
    return false;
  }
}

/**
 * Rotate the stored hash for an API key record (replace with new hash)
 */
export async function rotateApiKey(id: string, newHash: string): Promise<boolean> {
  try {
    if (!id || !newHash) return false;
    const result = await pool.query(
      `UPDATE api_keys SET hash = $1, updated_at = $2 WHERE id = $3 RETURNING id`,
      [newHash, new Date().toISOString(), id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.log('Error rotating api key:', error);
    return false;
  }
}

/**
 * Delete an API key by ID
 */
export async function deleteApiKey(id: string): Promise<boolean> {
  try {
    if (!id) {
      console.log('Cannot delete api key: No ID provided');
      return false;
    }
    const result = await pool.query(
      'DELETE FROM api_keys WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.log('Error deleting api key:', error);
    return false;
  }
}

export async function validateApiKey(key: string): Promise<string | null> {
  try {
    if (!key) {
      console.log('Cannot validate api key: No key provided');
      return null;
    }
    const hashedKey = sha256(key);
    const result = await pool.query(
      `SELECT id, user_id as "userId" FROM api_keys WHERE hash = $1`,
      [hashedKey]
    );
    return result.rows[0]?.userId || null;
  } catch (error) {
    console.log('Error validating api key:', error);
    return null;
  }
}

/**
 * OVERVIEW
 *
 * - Purpose: Manage api_keys table records in PostgreSQL for access control and integrations.
 * - Assumptions: id is UUID, userId is string (user identifier). SQL trigger updates updated_at.
 * - Edge Cases: Missing fields, invalid UUIDs, DB connectivity issues.
 * - How it fits: Used by auth and integration systems.
 * - Future Improvements: Add token/hash storage, scopes, last_used timestamp, and rotation helpers.
 */

/*
 * === api-keys-storage.ts ===
 * Updated: 2025-08-16
 * Summary: Implements CRUD operations for api_keys table.
 * Key Components:
 *   - ApiKey: Type definition
 *   - CRUD functions: save, get, update, delete
 * Dependencies:
 *   - Requires: pg, PostgreSQL >= 12
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Timestamps handled by DB trigger
 */
