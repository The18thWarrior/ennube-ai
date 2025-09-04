import { Redis } from '@upstash/redis';
import type { DescribeSObjectResult, DescribeGlobalResult } from 'jsforce';

// Configure your Upstash Redis connection here or via env vars
const redisUrl = process.env.KV_REST_API_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || '';
const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

const DESCRIBE_KEY = (subId: string, objectName: string) => `sfdc:describe:${subId}:${objectName}`;
const USER_DESCRIBES_PREFIX = (subId: string) => `sfdc:describe:list:${subId}`; // set of objectNames for a user

const GLOBAL_DESCRIBE_KEY = (subId: string) => `sfdc:global:describe:${subId}`;

/**
 * OVERVIEW
 *
 * - Purpose: Cache Salesforce sObject describe results per authenticated subject (subId).
 * - Data shape: Stored values are `DescribeSObjectResult` (from jsforce) serialized to Redis.
 * - Keys:
 *   - describe key: `sfdc:describe:${subId}:${objectName}`
 *   - index set: `sfdc:describe:list:${subId}` contains objectName strings
 * - Functions:
 *   - getDescribe, setDescribe, deleteDescribe, getUserDescribes, getAllDescribes
 *
 * Assumptions:
 * - Upstash Redis credentials are provided via KV_REST_API_URL and KV_REST_API_TOKEN env vars.
 * - objectName is a plain string suitable for inclusion in a Redis key.
 */

/**
 * Get a cached DescribeSObjectResult for a given user and object name.
 */
export async function getDescribe(subId: string, objectName: string): Promise<DescribeSObjectResult | null> {
  const key = DESCRIBE_KEY(subId, objectName);
  const data = await redis.get<DescribeSObjectResult | string>(key);
  if (!data) return null;
  try {
    // Upstash may return parsed objects or raw strings depending on usage; handle both.
    if (typeof data === 'string') {
      return JSON.parse(data) as DescribeSObjectResult;
    }
    return data as DescribeSObjectResult;
  } catch {
    return null;
  }
}

/**
 * Set or update a DescribeSObjectResult for a user and object name.
 * Also indexes the objectName in the user's set for later retrieval.
 */
export async function setDescribe(subId: string, objectName: string, describe: DescribeSObjectResult): Promise<void> {
  const key = DESCRIBE_KEY(subId, objectName);
  // Store as JSON string to preserve structure consistently
  await redis.set(key, JSON.stringify(describe));
  // Add objectName to user's set of describes
  await redis.sadd(USER_DESCRIBES_PREFIX(subId), objectName);
}

/**
 * Delete a cached describe for a given user and object name.
 */
export async function deleteDescribe(subId: string, objectName: string): Promise<void> {
  const key = DESCRIBE_KEY(subId, objectName);
  await redis.del(key);
  await redis.srem(USER_DESCRIBES_PREFIX(subId), objectName);
}

/**
 * Return list of objectNames that have cached describes for the provided user.
 */
export async function getUserDescribes(subId: string): Promise<string[]> {
  return await redis.smembers(USER_DESCRIBES_PREFIX(subId));
}

/**
 * Get all DescribeSObjectResult objects cached for a user. Returns an array with the objectName
 * and the optional describe (null if missing or parse failed).
 */
export async function getAllDescribes(subId: string): Promise<Array<{ objectName: string; describe: DescribeSObjectResult | null }>> {
  const objectNames = await getUserDescribes(subId);
  if (!objectNames.length) return [];
  const keys = objectNames.map((name) => DESCRIBE_KEY(subId, name));
  const results = await redis.mget(...keys);
  return objectNames.map((objectName, i) => {
    const data = results[i];
    if (!data) return { objectName, describe: null };
    try {
      if (typeof data === 'string') return { objectName, describe: JSON.parse(data) as DescribeSObjectResult };
      return { objectName, describe: data as DescribeSObjectResult };
    } catch {
      return { objectName, describe: null };
    }
  });
}

/**
 * Optionally clear all describes for a user (deletes keys and the index set).
 */
export async function deleteAllDescribes(subId: string): Promise<void> {
  const objectNames = await getUserDescribes(subId);
  if (objectNames.length) {
    const delKeys = objectNames.map((name) => DESCRIBE_KEY(subId, name));
    await redis.del(...delKeys);
  }
  await redis.del(USER_DESCRIBES_PREFIX(subId));
}

/**
 * GLOBAL DESCRIBE: store the DescribeGlobalResult for a user's connection
 */
export async function getGlobalDescribe(subId: string): Promise<DescribeGlobalResult | null> {
  const key = GLOBAL_DESCRIBE_KEY(subId);
  const data = await redis.get<DescribeGlobalResult | string>(key);
  if (!data) return null;
  try {
    if (typeof data === 'string') return JSON.parse(data) as DescribeGlobalResult;
    return data as DescribeGlobalResult;
  } catch {
    return null;
  }
}

export async function setGlobalDescribe(subId: string, describe: DescribeGlobalResult): Promise<void> {
  const key = GLOBAL_DESCRIBE_KEY(subId);
  await redis.set(key, JSON.stringify(describe));
}

export async function deleteGlobalDescribe(subId: string): Promise<void> {
  const key = GLOBAL_DESCRIBE_KEY(subId);
  await redis.del(key);
}

/*
 * === describe-history.ts ===
 * Updated: 2025-09-02 00:00
 * Summary: Redis-backed cache for Salesforce DescribeSObjectResult per user.
 */
