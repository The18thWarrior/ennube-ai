/**
 * Utility functions for managing HubSpot credentials in PostgreSQL
 */
import { Pool } from 'pg';
import { nanoid } from "nanoid";
import { auth } from '@/auth';
import { HubSpotAuthResult } from '../types';

// Create PostgreSQL connection pool using environment variables
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true
});

// Table name for credentials
const CREDENTIALS_TABLE = "credentials";

export interface StoredHubSpotCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  userInfo?: {
    id?: string;
    email?: string;
    name?: string;
    portalId?: number;
  };
  createdAt: number;
  expiresAt?: number;
}

/**
 * Store HubSpot credentials in PostgreSQL
 */
export async function storeHubSpotCredentials(authResult: HubSpotAuthResult): Promise<void> {
  try {
    if (!authResult.success || !authResult.accessToken) {
      throw new Error('Invalid auth result: Missing required fields');
    }

    // Get the current user's ID
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.id;
    const type = 'hubspot';
    const credentials = {
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      expiresIn: authResult.expiresIn,
      userInfo: authResult.userInfo,
      createdAt: Date.now(),
      expiresAt: authResult.expiresIn ? Date.now() + (authResult.expiresIn * 1000) : undefined,
    };

    // Check if credentials already exist for this user and type
    const checkQuery = `
      SELECT id FROM ${CREDENTIALS_TABLE}
      WHERE user_id = $1 AND type = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, type]);

    if (checkResult.rows.length > 0) {
      // Update existing credentials
      const updateQuery = `
        UPDATE ${CREDENTIALS_TABLE}
        SET credentials = $1, updated_at = NOW()
        WHERE user_id = $2 AND type = $3
      `;
      await pool.query(updateQuery, [credentials, userId, type]);
    } else {
      // Insert new credentials
      const insertQuery = `
        INSERT INTO ${CREDENTIALS_TABLE} (id, user_id, type, credentials, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `;
      await pool.query(insertQuery, [nanoid(), userId, type, credentials]);
    }

    console.log(`HubSpot credentials stored for user: ${userId}`);
  } catch (error) {
    console.error('Error storing HubSpot credentials:', error);
    throw error;
  }
}

/**
 * Get the HubSpot credentials for the current user
 */
export async function getHubSpotCredentialsById(): Promise<StoredHubSpotCredentials | null> {
  try {
    // Get the current user's ID
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.id;
    const type = 'hubspot';

    // Query for the credentials
    const query = `
      SELECT credentials
      FROM ${CREDENTIALS_TABLE}
      WHERE user_id = $1 AND type = $2
    `;
    const result = await pool.query(query, [userId, type]);

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0].credentials as StoredHubSpotCredentials;
  } catch (error) {
    console.error('Error retrieving HubSpot credentials:', error);
    throw error;
  }
}

/**
 * Get HubSpot credentials by user sub (ID)
 */
export async function getHubSpotCredentialsBySub(sub: string): Promise<StoredHubSpotCredentials | null> {
  try {
    const type = 'hubspot';

    // Query for credentials by sub
    const query = `
      SELECT c.credentials
      FROM ${CREDENTIALS_TABLE} c
      JOIN public.users u ON c.user_id = u.id
      WHERE u.auth0->>'sub' = $1 AND c.type = $2
    `;
    const result = await pool.query(query, [sub, type]);

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0].credentials as StoredHubSpotCredentials;
  } catch (error) {
    console.error('Error retrieving HubSpot credentials by sub:', error);
    throw error;
  }
}

/**
 * Update HubSpot credentials with new tokens
 */
export async function updateHubSpotCredentials(
  userId: string,
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number
): Promise<void> {
  try {
    const type = 'hubspot';

    // Get existing credentials
    const query = `
      SELECT credentials
      FROM ${CREDENTIALS_TABLE}
      WHERE user_id = $1 AND type = $2
    `;
    const result = await pool.query(query, [userId, type]);

    if (result.rowCount === 0) {
      throw new Error('No HubSpot credentials found to update');
    }

    const credentials = result.rows[0].credentials as StoredHubSpotCredentials;
    
    // Update tokens
    credentials.accessToken = accessToken;
    if (refreshToken) {
      credentials.refreshToken = refreshToken;
    }
    if (expiresIn) {
      credentials.expiresIn = expiresIn;
      credentials.expiresAt = Date.now() + (expiresIn * 1000);
    }

    // Save updated credentials
    const updateQuery = `
      UPDATE ${CREDENTIALS_TABLE}
      SET credentials = $1, updated_at = NOW()
      WHERE user_id = $2 AND type = $3
    `;
    await pool.query(updateQuery, [credentials, userId, type]);

    console.log(`HubSpot credentials updated for user: ${userId}`);
  } catch (error) {
    console.error('Error updating HubSpot credentials:', error);
    throw error;
  }
}

/**
 * Remove HubSpot credentials for the current user
 */
export async function removeHubSpotCredentials(): Promise<void> {
  try {
    // Get the current user's ID
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.id;
    const type = 'hubspot';

    // Delete the credentials
    const query = `
      DELETE FROM ${CREDENTIALS_TABLE}
      WHERE user_id = $1 AND type = $2
    `;
    await pool.query(query, [userId, type]);

    console.log(`HubSpot credentials removed for user: ${userId}`);
  } catch (error) {
    console.error('Error removing HubSpot credentials:', error);
    throw error;
  }
}

/**
 * Check if the current user has HubSpot credentials
 */
export async function hasHubSpotCredentials(): Promise<boolean> {
  try {
    const credentials = await getHubSpotCredentialsById();
    return credentials !== null;
  } catch (error) {
    console.error('Error checking for HubSpot credentials:', error);
    return false;
  }
}
