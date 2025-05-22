/**
 * Utility functions for managing GSuite credentials in Upstash Redis
 */
import { Redis } from '@upstash/redis';
import { nanoid } from "nanoid";
import { GSuiteAuthResult } from "./gsuite";
import { auth } from '@/auth';

// Create Redis client
const redis = Redis.fromEnv();

// Prefix for our GSuite credentials
const GSUITE_CRED_PREFIX = "gsuite_cred:";
const GSUITE_SESSION_PREFIX = "gsuite_session:";

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
 * Store GSuite credentials in Upstash Redis
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

    const credentials: StoredGSuiteCredentials = {
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      expiryDate: authResult.expiryDate,
      clientId: authResult.clientId,
      clientSecret: authResult.clientSecret,
      userInfo: authResult.userInfo,
      createdAt,
      expiresAt,
    };
    const _credentials = JSON.stringify(credentials);
    
    // Store credentials with user ID if available
    const key = `${GSUITE_CRED_PREFIX}${session.user.auth0.sub}`;
    await redis.set(
      key,
      _credentials
    );
    
    return sessionId;
  } catch (error) {
    console.error("Error storing GSuite credentials:", error);
    return null;
  }
}

/**
 * Retrieve GSuite credentials from Upstash Redis by session ID
 */
export async function getGSuiteCredentialsById(): Promise<StoredGSuiteCredentials | null> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return null;
    }
    const key = `${GSUITE_CRED_PREFIX}${session.user.auth0.sub}`;
    
    const credentials = await redis.get<StoredGSuiteCredentials>(
      key
    );
    
    if (!credentials) {
      console.error("No credentials found for key:", key);
      return null;
    }
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
 * Retrieve GSuite credentials from Upstash Redis by user sub
 */
export async function getGSuiteCredentialsBySub(sub: string): Promise<StoredGSuiteCredentials | null> {
  try {
    const key = `${GSUITE_CRED_PREFIX}${sub}`;
    
    const credentials = await redis.get<StoredGSuiteCredentials>(
      key
    );
    
    if (!credentials) {
      console.error("No credentials found for key:", key);
      return null;
    }
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
 * Remove GSuite credentials from Upstash Redis
 */
export async function removeGSuiteCredentials(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return false;
    }
    const key = `${GSUITE_CRED_PREFIX}${session.user.auth0.sub}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Error removing GSuite credentials:", error);
    return false;
  }
}

/**
 * Update existing GSuite credentials in Upstash Redis (useful after token refresh)
 */
export async function updateGSuiteCredentials(updatedCredentials: Partial<StoredGSuiteCredentials>): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return false;
    }
    
    // Get existing credentials
    const key = `${GSUITE_CRED_PREFIX}${session.user.auth0.sub}`;
    const existingCredentials = await redis.get<StoredGSuiteCredentials>(key);
    
    if (!existingCredentials) {
      console.error("No existing credentials found to update");
      return false;
    }
    
    // Merge existing and updated credentials
    const newCredentials: StoredGSuiteCredentials = {
      ...existingCredentials,
      ...updatedCredentials,
      // Reset expiry if we're updating credentials
      expiresAt: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
    
    await redis.set(key, JSON.stringify(newCredentials));
    return true;
  } catch (error) {
    console.error("Error updating GSuite credentials:", error);
    return false;
  }
}