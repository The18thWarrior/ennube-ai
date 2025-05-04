/**
 * Utility functions for managing Salesforce credentials in Upstash Redis
 */
import { Redis } from '@upstash/redis';
import { nanoid } from "nanoid";
import { SalesforceAuthResult } from "./salesforce";
import { auth } from '@/auth';

// Create Redis client
const redis = Redis.fromEnv();

// Prefix for our Salesforce credentials
const SF_CRED_PREFIX = "sf_cred:";
const SF_SESSION_PREFIX = "sf_session:";

export interface StoredSalesforceCredentials {
  accessToken: string;
  instanceUrl: string;
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

/**
 * Store Salesforce credentials in Upstash Redis
 */
export async function storeSalesforceCredentials(authResult: SalesforceAuthResult): Promise<string | null> {
  if (!authResult.success || !authResult.accessToken || !authResult.instanceUrl) {
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

    const credentials: StoredSalesforceCredentials = {
      accessToken: authResult.accessToken,
      instanceUrl: authResult.instanceUrl,
      userInfo: authResult.userInfo,
      createdAt,
      expiresAt,
    };
    const _credentials = JSON.stringify(credentials);
    //console.log("Storing Salesforce credentials:", _credentials);
    // Store credentials with user ID if available
    const key = `${SF_CRED_PREFIX}${session.user.auth0.sub}`;
    await redis.set(
      key,
      _credentials
    );
    //console.log("Salesforce credentials stored successfully", key);
    return sessionId;
  } catch (error) {
    console.error("Error storing Salesforce credentials:", error);
    return null;
  }
}

/**
 * Retrieve Salesforce credentials from Upstash Redis by session ID
 */
export async function getSalesforceCredentialsById(): Promise<StoredSalesforceCredentials | null> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return null;
    }
    const key = `${SF_CRED_PREFIX}${session.user.auth0.sub}`;
    //console.log("Key:", key);
    const credentials = await redis.get<StoredSalesforceCredentials>(
      key
    );
    
    if (!credentials) {
      console.error("No credentials found for key:", key, credentials);
      return null;
    }
    if (Date.now() > credentials.expiresAt) {
      //return null;
    }

    return credentials;
  } catch (error) {
    console.error("Error retrieving Salesforce credentials:", error);
    //await removeSalesforceCredentials();
    return null;
  }
}

/**
 * Remove Salesforce credentials from Upstash Redis
 */
export async function removeSalesforceCredentials(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return false;
    }
    const key = `${SF_CRED_PREFIX}${session.user.auth0.sub}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Error removing Salesforce credentials:", error);
    return false;
  }
}
