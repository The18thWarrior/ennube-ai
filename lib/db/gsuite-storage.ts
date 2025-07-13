/**
 * Utility functions for managing GSuite credentials in PostgreSQL
 */
import { Pool } from 'pg';
import { nanoid } from "nanoid";
import { GSuiteAuthResult } from "../gsuite";
import { auth } from '@/auth';

// Create PostgreSQL connection pool using environment variables
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true
});

// Test the connection and log success or error
// pool.query('SELECT NOW()', (err, res) => {
//   if (err) {
//     console.error('Error connecting to PostgreSQL database:', err);
//   } else {
//     console.log('PostgreSQL connected successfully');
//   }
// });

// Table name for credentials
const CREDENTIALS_TABLE = "credentials";

export interface StoredGSuiteCredentials {
  accessToken: string;
  refreshToken?: string | null;
  expiryDate?: number | null;
  clientId?: string | null;
  clientSecret?: string | null;
  userInfo?: {
    email?: string | null;
    name?: string | null;
    picture?: string | null;
  };
  createdAt: number;
  expiresAt: number;
}

/**
 * Store GSuite credentials in PostgreSQL
 */
export async function storeGSuiteCredentials(authResult: GSuiteAuthResult): Promise<string | null> {
  if (!authResult.success || !authResult.accessToken) {
    return null;
  }
  const session = await auth();

  if (!session || !session.user || !session.user.auth0) {
    console.error("No session found");
    return null;
  }

  try {
    const sessionId = nanoid();
    const createdAt = Date.now();
    const expiresAt = createdAt + 2 * 60 * 60 * 1000; // 2 hours
    const userSub = session.user.auth0.sub;

    // Check if user already has credentials stored
    const checkResult = await pool.query(
      `SELECT COUNT(*) FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'gsuite'`,
      [userSub]
    );
    
    const exists = parseInt(checkResult.rows[0].count) > 0;
    
    if (exists) {
      // Update existing credentials
      await pool.query(
        `UPDATE ${CREDENTIALS_TABLE} 
         SET access_token = $1, instance_url = $2, refresh_token = $3, 
             user_info_id = $4, user_info_organization_id = $5, user_info_display_name = $6,
             user_info_email = $7, user_info_organization_id_alt = $8,
             created_at = $9, expires_at = $10
         WHERE user_id = $11 AND type = 'gsuite'`,
        [
          authResult.accessToken,
          authResult.clientId || '', // Using clientId as instance_url
          authResult.refreshToken || null,
          null, // No user_info_id equivalent
          null, // No organization_id equivalent
          authResult.userInfo?.name || null,
          authResult.userInfo?.email || null,
          null, // No organization_id_alt equivalent
          createdAt,
          expiresAt,
          userSub
        ]
      );
    } else {
      // Insert new credentials
      await pool.query(
        `INSERT INTO ${CREDENTIALS_TABLE}
         (user_id, type, access_token, instance_url, refresh_token, 
          user_info_id, user_info_organization_id, user_info_display_name, 
          user_info_email, user_info_organization_id_alt, created_at, expires_at)
         VALUES ($1, 'gsuite', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          userSub,
          authResult.accessToken,
          authResult.clientId || '', // Using clientId as instance_url
          authResult.refreshToken || null,
          null, // No user_info_id equivalent
          null, // No organization_id equivalent
          authResult.userInfo?.name || null,
          authResult.userInfo?.email || null,
          null, // No organization_id_alt equivalent
          createdAt,
          expiresAt
        ]
      );
    }
    
    return sessionId;
  } catch (error) {
    console.error("Error storing GSuite credentials:", error);
    return null;
  }
}

/**
 * Retrieve GSuite credentials from PostgreSQL for current user
 */
export async function getGSuiteCredentialsById(): Promise<StoredGSuiteCredentials | null> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return null;
    }
    
    const userSub = session.user.auth0.sub;
    const result = await pool.query(
      `SELECT 
        access_token as "accessToken", 
        instance_url as "clientId", 
        refresh_token as "refreshToken",
        created_at as "createdAt",
        expires_at as "expiresAt",
        jsonb_build_object(
          'name', user_info_display_name,
          'email', user_info_email,
          'picture', null
        ) as "userInfo"
       FROM ${CREDENTIALS_TABLE} 
       WHERE user_id = $1 AND type = 'gsuite'`,
      [userSub]
    );
    
    if (result.rows.length === 0) {
      console.error("No GSuite credentials found for user:", userSub);
      return null;
    }
    
    const credentials = result.rows[0] as StoredGSuiteCredentials;
    
    // Handle potential expiration check
    if (Date.now() > credentials.expiresAt) {
      // Credentials expired, but we'll still return them
      // to allow for token refresh attempt
    }

    return credentials;
  } catch (error) {
    console.error("Error retrieving GSuite credentials:", error);
    return null;
  }
}

/**
 * Retrieve GSuite credentials from PostgreSQL by user sub
 */
export async function getGSuiteCredentialsBySub(sub: string): Promise<StoredGSuiteCredentials | null> {
  try {
    const result = await pool.query(
      `SELECT 
        access_token as "accessToken", 
        instance_url as "clientId", 
        refresh_token as "refreshToken",
        created_at as "createdAt",
        expires_at as "expiresAt",
        jsonb_build_object(
          'name', user_info_display_name,
          'email', user_info_email,
          'picture', null
        ) as "userInfo"
       FROM ${CREDENTIALS_TABLE} 
       WHERE user_id = $1 AND type = 'gsuite'`,
      [sub]
    );
    
    if (result.rows.length === 0) {
      console.error("No GSuite credentials found for sub:", sub);
      return null;
    }
    
    const credentials = result.rows[0] as StoredGSuiteCredentials;
    
    // Handle potential expiration check
    if (Date.now() > credentials.expiresAt) {
      // Credentials expired, but we'll still return them
      // to allow for token refresh attempt
    }

    return credentials;
  } catch (error) {
    console.error("Error retrieving GSuite credentials:", error);
    return null;
  }
}

/**
 * Remove GSuite credentials from PostgreSQL
 */
export async function removeGSuiteCredentials(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return false;
    }
    
    const userSub = session.user.auth0.sub;
    await pool.query(
      `DELETE FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'gsuite'`,
      [userSub]
    );
    
    return true;
  } catch (error) {
    console.error("Error removing GSuite credentials:", error);
    return false;
  }
}

/**
 * Update existing GSuite credentials in PostgreSQL (useful after token refresh)
 */
export async function updateGSuiteCredentials(updatedCredentials: Partial<StoredGSuiteCredentials>): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return false;
    }
    
    const userSub = session.user.auth0.sub;
    const now = Date.now();
    const expiresAt = now + 2 * 60 * 60 * 1000; // 2 hours
    
    // Check if credentials exist
    const checkResult = await pool.query(
      `SELECT COUNT(*) FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'gsuite'`,
      [userSub]
    );
    
    if (parseInt(checkResult.rows[0].count) === 0) {
      console.error("No existing GSuite credentials found to update");
      return false;
    }
    
    // Update the credentials
    await pool.query(
      `UPDATE ${CREDENTIALS_TABLE} 
       SET access_token = COALESCE($1, access_token),
           refresh_token = COALESCE($2, refresh_token),
           expires_at = $3
       WHERE user_id = $4 AND type = 'gsuite'`,
      [
        updatedCredentials.accessToken || null,
        updatedCredentials.refreshToken || null,
        expiresAt,
        userSub
      ]
    );
    
    return true;
  } catch (error) {
    console.error("Error updating GSuite credentials:", error);
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
    console.error('Error closing PostgreSQL connection pool:', error);
  }
}