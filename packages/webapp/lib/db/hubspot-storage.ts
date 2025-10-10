/**
 * Utility functions for managing HubSpot credentials in PostgreSQL
 */
import { Pool } from 'pg';
import { nanoid } from "nanoid";
import { auth } from '@/auth';
import { HubSpotAuthResult } from '../types';
import dayjs from 'dayjs';

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
  id?: string; // Optional ID for the credentials
  userId? : string;
  accessToken: string;
  instanceUrl: string;
  refreshToken?: string;
  userInfo?: {
    id?: string;
    organization_id?: string;
    display_name?: string;
    email?: string;
    organizationId?: string;
  };
  createdAt: number;
  expiresAt: number;
  account_timestamp_field?: string; // Field name to use for timestamps
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
    if (!session || !session.user || !session.user.auth0) {
      console.log("No session found");
      return;
    }
    
    const userId = session.user.auth0.sub;

    const type = 'hubspot';
    
    const createdAt = Date.now();
    const expiresAt = authResult.expiresIn ? authResult.expiresIn : createdAt + 2 * 60 * 60 * 1000;

    // Check if credentials already exist for this user and type
    const checkQuery = `
      SELECT id FROM ${CREDENTIALS_TABLE}
      WHERE user_id = $1 AND type = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, type]);

    if (checkResult.rows.length > 0) {
      // Update existing credentials with individual fields
      const updateQuery = `
        UPDATE ${CREDENTIALS_TABLE}
        SET access_token = $1, instance_url = $2, refresh_token = $3, 
            user_info_id = $4, user_info_email = $5, user_info_display_name = $6,
            user_info_organization_id = $7, expires_at = $8
        WHERE user_id = $9 AND type = $10
      `;
      await pool.query(updateQuery, [
        authResult.accessToken,
        "",
        authResult.refreshToken || null,
        authResult.userInfo?.id || null,
        authResult.userInfo?.email || null,
        authResult.userInfo?.name || null,
        authResult.userInfo?.portalId || null,
        expiresAt || null,
        userId,
        type
      ]);
    } else {
      // Insert new credentials with individual fields
      const insertQuery = `
        INSERT INTO ${CREDENTIALS_TABLE}
        (user_id, instance_url, type, access_token, refresh_token, 
         user_info_id, user_info_email, user_info_display_name, 
         user_info_organization_id, created_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      await pool.query(insertQuery, [
        userId,
        "", // instance_url is not used in HubSpot, can be left empty
        type,
        authResult.accessToken,
        authResult.refreshToken || null,
        authResult.userInfo?.id || null,
        authResult.userInfo?.email || null,
        authResult.userInfo?.name || null,
        authResult.userInfo?.portalId || null,
        createdAt,
        expiresAt || null
      ]);
    }

    console.log(`HubSpot credentials stored for user: ${userId}`);
  } catch (error) {
    console.log('Error storing HubSpot credentials:', error);
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
    if (!session || !session.user || !session.user.auth0) {
      console.log("No session found");
      return null;
    }
    
    const userSub = session.user.auth0.sub;
    const type = 'hubspot';

    // Query for the credentials with individual columns
    // const query = `
    //   SELECT id, access_token, refresh_token, 
    //          user_info_id, user_info_email, user_info_display_name, 
    //          user_info_organization_id, created_at, expires_at,
    //          metadata->>'account_timestamp_field' as account_timestamp_field
    //   FROM ${CREDENTIALS_TABLE}
    //   WHERE user_id = $1 AND type = $2
    // `;
    // const result = await pool.query(query, [userId, type]);
    const result = await pool.query(
      `SELECT 
        access_token as "accessToken", 
        instance_url as "instanceUrl", 
        refresh_token as "refreshToken",
        created_at as "createdAt",
        expires_at as "expiresAt",
        account_timestamp_field as "account_timestamp_field",
        jsonb_build_object(
          'id', user_info_id,
          'organization_id', user_info_organization_id,
          'display_name', user_info_display_name,
          'email', user_info_email,
          'organizationId', user_info_organization_id_alt
        ) as "userInfo"
        FROM ${CREDENTIALS_TABLE} 
        WHERE user_id = $1 AND type = 'hubspot'`,
      [userSub]
    );
    
    if (result.rows.length === 0 || !result.rows[0]) {
      console.log("No credentials found for user:", userSub);
      return null;
    }
    
    const credentials = result.rows[0] as StoredHubSpotCredentials;

    // Handle potential expiration check
    //if (Date.now() > credentials.expiresAt) {
      // Commented out to match original behavior
      // return null;
    //}

    return {...credentials, userId: userSub }; // Include userId in the returned object
  } catch (error) {
    console.log('Error retrieving HubSpot credentials:', error);
    throw error;
  }
}

/**
 * Get HubSpot credentials by user sub (ID)
 */
export async function getHubspotCredentialsBySub(sub: string): Promise<StoredHubSpotCredentials | null> {
  try {
    const result = await pool.query(
      `SELECT 
        access_token as "accessToken", 
        instance_url as "instanceUrl", 
        refresh_token as "refreshToken",
        created_at as "createdAt",
        expires_at as "expiresAt",
        account_timestamp_field as "account_timestamp_field",
        jsonb_build_object(
          'id', user_info_id,
          'organization_id', user_info_organization_id,
          'display_name', user_info_display_name,
          'email', user_info_email,
          'organizationId', user_info_organization_id_alt
        ) as "userInfo"
       FROM ${CREDENTIALS_TABLE} 
       WHERE user_id = $1 AND type = 'hubspot'`,
      [sub]
    );
    
    if (result.rows.length === 0) {
      console.log("No credentials found for sub:", sub);
      return null;
    }
    
    const credentials = result.rows[0] as StoredHubSpotCredentials;
    
    // Handle potential expiration check
    if (Date.now() > credentials.expiresAt) {
      // Commented out to match original behavior
      // return null;
    }

    return {...credentials, userId: sub};
  } catch (error) {
    console.log("Error retrieving HubSpot credentials:", error);
    return null;
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
    const expiresAt = expiresIn ? dayjs(Date.now() + (expiresIn * 1000)).unix() : undefined;

    // Check if credentials exist for this user
    const checkQuery = `
      SELECT id FROM ${CREDENTIALS_TABLE}
      WHERE user_id = $1 AND type = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, type]);

    if (checkResult.rowCount === 0) {
      throw new Error('No HubSpot credentials found to update');
    }

    // Update tokens with individual columns
    const updateQuery = `
      UPDATE ${CREDENTIALS_TABLE}
      SET access_token = $1, refresh_token = $2, expires_at = $3
      WHERE user_id = $4 AND type = $5
    `;
    const queryParams = [
      accessToken,
      refreshToken || null,
      expiresAt || null,
      userId,
      type
    ];
    //console.log(queryParams)
    await pool.query(updateQuery, queryParams);

    console.log(`HubSpot credentials updated for user: ${userId}`);
  } catch (error) {
    console.log('Error updating HubSpot credentials:', error);
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
    console.log('Error removing HubSpot credentials:', error);
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
    console.log('Error checking for HubSpot credentials:', error);
    return false;
  }
}

/**
 * Update the account timestamp field for HubSpot integration
 */
export async function updateHubSpotTimestampField(timestampField: string): Promise<boolean> {
  try {
    // Get the current user's ID
    const session = await auth();
    if (!session?.user?.auth0?.sub) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.auth0.sub;
    const type = 'hubspot';

    // Check if credentials exist for this user
    const checkQuery = `
      SELECT id FROM ${CREDENTIALS_TABLE}
      WHERE user_id = $1 AND type = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, type]);

    if (checkResult.rowCount === 0) {
      throw new Error('No HubSpot credentials found to update');
    }

    // Update timestamp field in the metadata JSON column
    const updateQuery = `
      UPDATE ${CREDENTIALS_TABLE}
      SET account_timestamp_field = $1
      WHERE user_id = $2 AND type = $3
    `;
    await pool.query(updateQuery, [timestampField, userId, type]);

    console.log(`HubSpot timestamp field updated to ${timestampField} for user: ${userId}`);
    return true;
  } catch (error) {
    console.log('Error updating HubSpot timestamp field:', error);
    return false;
  }
}
