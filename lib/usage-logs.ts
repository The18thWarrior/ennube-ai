/**
 * Utility functions for managing usage logs in Upstash Redis for billing purposes
 */
import { Redis } from '@upstash/redis';
import { nanoid } from "nanoid";
import { auth } from '@/auth';

// Create Redis client
const redis = Redis.fromEnv();

// Prefix for usage logs
const USAGE_LOG_PREFIX = "usage_log:";

export interface UsageLogEntry {
  timestamp: number;
  userSub: string;
  agent: string;
  recordsUpdated: number;
  recordsCreated: number;
  meetingsBooked: number;
  signature: string;
  nonce: number;
}

/**
 * Store usage log entry in Upstash Redis
 */
export async function storeUsageLog(
  userSub: string,
  agent: string,
  recordsUpdated: number = 0,
  recordsCreated: number = 0,
  meetingsBooked: number = 0,
  signature: string = "",
  nonce: number = 0
): Promise<string | null> {
  try {
    const logId = nanoid();
    const timestamp = Date.now();

    const usageLog: UsageLogEntry = {
      timestamp,
      userSub,
      agent,
      recordsUpdated,
      recordsCreated,
      meetingsBooked,
      signature,
      nonce,
    };

    // Store log with unique ID
    const key = `${USAGE_LOG_PREFIX}${logId}`;
    await redis.set(key, JSON.stringify(usageLog));
    
    // Also store in a list of logs for this user for easy retrieval
    const userLogsKey = `${USAGE_LOG_PREFIX}user:${userSub}`;
    await redis.lpush(userLogsKey, key);
    
    return logId;
  } catch (error) {
    console.error("Error storing usage log:", error);
    return null;
  }
}

/**
 * Retrieve usage logs for the current authenticated user
 */
export async function getUserUsageLogs(
  limit: number = 100,
  offset: number = 0
): Promise<UsageLogEntry[]> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return [];
    }
    
    const userSub = session.user.auth0.sub;
    return await getUserUsageLogsBySub(userSub, limit, offset);
  } catch (error) {
    console.error("Error retrieving user usage logs:", error);
    return [];
  }
}

/**
 * Retrieve usage logs for a specific user by their sub ID
 */
export async function getUserUsageLogsBySub(
  sub: string,
  limit: number = 100,
  offset: number = 0
): Promise<UsageLogEntry[]> {
  try {
    const userLogsKey = `${USAGE_LOG_PREFIX}user:${sub}`;
    
    // Get log keys for this user
    const logKeys = await redis.lrange<string>(userLogsKey, offset, offset + limit - 1);
    
    if (!logKeys || logKeys.length === 0) {
      return [];
    }
    
    // Get all logs in parallel
    const logPromises = logKeys.map(key => redis.get<UsageLogEntry>(key));
    const logs = await Promise.all(logPromises);
    
    // Filter out any null values and sort by timestamp (newest first)
    return logs
      .filter((log): log is UsageLogEntry => log !== null)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error retrieving usage logs by sub:", error);
    return [];
  }
}

/**
 * Get usage summary for a specific time period
 */
export async function getUsageSummary(
  startTime: number,
  endTime: number = Date.now()
): Promise<{
  recordsUpdated: number;
  recordsCreated: number;
  meetingsBooked: number;
}> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return { recordsUpdated: 0, recordsCreated: 0, meetingsBooked: 0 };
    }
    
    const userSub = session.user.auth0.sub;
    return await getUsageSummaryBySub(userSub, startTime, endTime);
  } catch (error) {
    console.error("Error retrieving usage summary:", error);
    return { recordsUpdated: 0, recordsCreated: 0, meetingsBooked: 0 };
  }
}

/**
 * Get usage summary for a specific user by their sub ID for a specific time period
 */
export async function getUsageSummaryBySub(
  sub: string,
  startTime: number,
  endTime: number = Date.now()
): Promise<{
  recordsUpdated: number;
  recordsCreated: number;
  meetingsBooked: number;
}> {
  try {
    const logs = await getUserUsageLogsBySub(sub);
    
    // Filter logs by time period and reduce to get totals
    const summary = logs
      .filter(log => log.timestamp >= startTime && log.timestamp <= endTime)
      .reduce(
        (acc, log) => {
          return {
            recordsUpdated: acc.recordsUpdated + log.recordsUpdated,
            recordsCreated: acc.recordsCreated + log.recordsCreated,
            meetingsBooked: acc.meetingsBooked + log.meetingsBooked,
          };
        },
        { recordsUpdated: 0, recordsCreated: 0, meetingsBooked: 0 }
      );
    
    return summary;
  } catch (error) {
    console.error("Error retrieving usage summary by sub:", error);
    return { recordsUpdated: 0, recordsCreated: 0, meetingsBooked: 0 };
  }
}

/**
 * Clear all usage logs for a user
 */
export async function clearUserUsageLogs(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return false;
    }
    
    const userSub = session.user.auth0.sub;
    return await clearUserUsageLogsBySub(userSub);
  } catch (error) {
    console.error("Error clearing user usage logs:", error);
    return false;
  }
}

/**
 * Clear all usage logs for a specific user by their sub ID
 */
export async function clearUserUsageLogsBySub(sub: string): Promise<boolean> {
  try {
    const userLogsKey = `${USAGE_LOG_PREFIX}user:${sub}`;
    
    // Get all log keys for this user
    const logKeys = await redis.lrange<string>(userLogsKey, 0, -1);
    
    if (logKeys && logKeys.length > 0) {
      // Delete all individual log entries
      const deletePromises = logKeys.map(key => redis.del(key));
      await Promise.all(deletePromises);
    }
    
    // Delete the user's log list
    await redis.del(userLogsKey);
    
    return true;
  } catch (error) {
    console.error("Error clearing user usage logs by sub:", error);
    return false;
  }
}
