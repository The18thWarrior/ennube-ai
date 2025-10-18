/**
 * Utility functions for managing Salesforce credentials in PostgreSQL
 */
import { Pool } from 'pg';
import { nanoid } from "nanoid";
import { auth } from '@/auth';
import { SalesforceAuthResult } from '../types';

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
//     console.log('Error connecting to PostgreSQL database:', err);
//   } else {
//     console.log('PostgreSQL connected successfully');
//   }
// });

// Table name for credentials
const CREDENTIALS_TABLE = "credentials";

export interface StoredSalesforceCredentials {
  accessToken: string;
  instanceUrl: string;
  refreshToken?: string;
  describeEmbedUrl?: string;
  userInfo?: {
    id?: string;
    organization_id?: string;
    display_name?: string;
    email?: string;
    organizationId?: string;
  };
  createdAt: number;
  expiresAt: number;
}

// We don't need to ensure the table exists since it's created by the SQL script

/**
 * Store Salesforce credentials in PostgreSQL
 */
export async function storeSalesforceCredentials(authResult: SalesforceAuthResult): Promise<string | null> {
  if (!authResult.success || !authResult.accessToken || !authResult.instanceUrl) {
    return null;
  }
  const session = await auth();

  if (!session || !session.user || !session.user.auth0) {
    console.log("No session found");
    return null;
  }

  try {
    const sessionId = nanoid();
    const createdAt = Date.now();
    const expiresAt = createdAt + 2 * 60 * 60 * 1000; // 2 hours
    const userSub = session.user.sub;

    // Check if user already has credentials stored
    const checkResult = await pool.query(
      `SELECT COUNT(*) FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'sfdc'`,
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
         describe_embed_url = $9,
             created_at = $9, expires_at = $10
         WHERE user_id = $11 AND type = 'sfdc'`,
        [
          authResult.accessToken,
          authResult.instanceUrl,
          authResult.refreshToken || null,
          authResult.userInfo?.id || null,
          authResult.userInfo?.organization_id || null,
          authResult.userInfo?.display_name || null,
          authResult.userInfo?.email || null,
          authResult.userInfo?.organizationId || null,
       authResult.describeEmbedUrl || null,
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
          user_info_email, user_info_organization_id_alt, describe_embed_url, created_at, expires_at)
         VALUES ($1, 'sfdc', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          userSub,
          authResult.accessToken,
          authResult.instanceUrl,
          authResult.refreshToken || null,
          authResult.userInfo?.id || null,
          authResult.userInfo?.organization_id || null,
          authResult.userInfo?.display_name || null,
          authResult.userInfo?.email || null,
          authResult.userInfo?.organizationId || null,
          authResult.describeEmbedUrl || null,
          createdAt,
          expiresAt
        ]
      );
    }
    
    return sessionId;
  } catch (error) {
    console.log("Error storing Salesforce credentials:", error);
    return null;
  }
}

export async function updateSalesforceCredentials(authResult: SalesforceAuthResult): Promise<string | null> {
  if (!authResult.success || !authResult.accessToken || !authResult.instanceUrl) {
    return null;
  }

  try {
    const createdAt = Date.now();
    const expiresAt = createdAt + 2 * 60 * 60 * 1000; // 2 hours

    // Check if user already has credentials stored
    const checkResult = await pool.query(
      `SELECT COUNT(*) FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'sfdc'`,
      [authResult.userId]
    );
    
    const exists = parseInt(checkResult.rows[0].count) > 0;
    
    if (exists) {
      // Update existing credentials
      await pool.query(
        `UPDATE ${CREDENTIALS_TABLE} 
         SET access_token = $1, expires_at = $2
         WHERE user_id = $3 AND type = 'sfdc'`,
        [
          authResult.accessToken,
          expiresAt,
          authResult.userId
        ]
      );
    } else {
     return null;
    }
    
    return null;
  } catch (error) {
    console.log("Error storing Salesforce credentials:", error);
    return null;
  }
}

/**
 * Retrieve Salesforce credentials from PostgreSQL for current user
 */
export async function getSalesforceCredentialsById(): Promise<StoredSalesforceCredentials | null> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.sub) {
      console.log("No session found");
      return null;
    }
    
    const userSub = session.user.sub;
    const result = await pool.query(
      `SELECT 
        access_token as "accessToken", 
        instance_url as "instanceUrl", 
        refresh_token as "refreshToken",
  describe_embed_url as "describeEmbedUrl",
        created_at as "createdAt",
        expires_at as "expiresAt",
        jsonb_build_object(
          'id', user_info_id,
          'organization_id', user_info_organization_id,
          'display_name', user_info_display_name,
          'email', user_info_email,
          'organizationId', user_info_organization_id_alt
        ) as "userInfo"
       FROM ${CREDENTIALS_TABLE} 
       WHERE user_id = $1 AND type = 'sfdc'`,
      [userSub]
    );
    
    if (result.rows.length === 0) {
      console.log("No credentials found for user:", userSub);
      return null;
    }
    
    const credentials = result.rows[0] as StoredSalesforceCredentials;
    
    // Handle potential expiration check
    if (Date.now() > credentials.expiresAt) {
      // Commented out to match original behavior
      // return null;
    }

    return credentials;
  } catch (error) {
    console.log("Error retrieving Salesforce credentials:", error);
    return null;
  }
}

/**
 * Retrieve Salesforce credentials from PostgreSQL by user sub
 */
export async function getSalesforceCredentialsBySub(sub: string): Promise<StoredSalesforceCredentials | null> {
  try {
    const result = await pool.query(
      `SELECT 
        access_token as "accessToken", 
        instance_url as "instanceUrl", 
        refresh_token as "refreshToken",
        describe_embed_url as "describeEmbedUrl",
        created_at as "createdAt",
        expires_at as "expiresAt",
        jsonb_build_object(
          'id', user_info_id,
          'organization_id', user_info_organization_id,
          'display_name', user_info_display_name,
          'email', user_info_email,
          'organizationId', user_info_organization_id_alt
        ) as "userInfo"
       FROM ${CREDENTIALS_TABLE} 
       WHERE user_id = $1 AND type = 'sfdc'`,
      [sub]
    );
    
    if (result.rows.length === 0) {
      console.log("No credentials found for sub:", sub);
      return null;
    }
    
    const credentials = result.rows[0] as StoredSalesforceCredentials;
    
    // Handle potential expiration check
    if (Date.now() > credentials.expiresAt) {
      // Commented out to match original behavior
      // return null;
    }

    return credentials;
  } catch (error) {
    console.log("Error retrieving Salesforce credentials:", error);
    return null;
  }
}

/**
 * Remove Salesforce credentials from PostgreSQL
 */
export async function removeSalesforceCredentials(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.log("No session found");
      return false;
    }
    
    const userSub = session.user.sub;
    await pool.query(
      `DELETE FROM ${CREDENTIALS_TABLE} WHERE user_id = $1 AND type = 'sfdc'`,
      [userSub]
    );
    
    return true;
  } catch (error) {
    console.log("Error removing Salesforce credentials:", error);
    return false;
  }
}

/**
 * Update the describe_embed_url column for a specific user and credential type
 * @param userId - the user's auth0 sub or identifier stored in user_id column
 * @param type - credential type (e.g. 'sfdc')
 * @param describeEmbedUrl - the new describe embed URL to set (or null to clear)
 * @returns boolean - true if a row was updated, false otherwise
 */
export async function updateDescribeEmbedUrlByUserAndType(
  userId: string,
  describeEmbedUrl: string | null
): Promise<boolean> {
  try {
    const result = await pool.query(
      `UPDATE ${CREDENTIALS_TABLE}
       SET describe_embed_url = $1
       WHERE user_id = $2 AND type = 'sfdc'`,
      [describeEmbedUrl, userId]
    );

    // rowCount > 0 means at least one row was updated
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.log('Error updating describe_embed_url:', error);
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
