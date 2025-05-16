/**
 * Utility functions for managing usage logs in Upstash Redis for billing purposes
 */
import { Redis } from '@upstash/redis';
import { nanoid } from "nanoid";
import { auth } from '@/auth';

const AGENTNAMES = {
  prospectFinder: 'ProspectFinder',
  dataSteward: 'DataSteward',
}

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
  createdAt? : string;
  updatedAt? : string;
  status? : string;
  responseData?: any;
}

interface Execution {
  id: number
  agent_name: string
  image_url: string
  status: string
  execution_time: number | null
  created_at: string
  response_data: any
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
  nonce: number = 0,
  logId: string = nanoid(),
  isNew: boolean = false, 
  status: string = "In Progress",
  errors: string | null = null
  
): Promise<string | null> {
  try {
    const timestamp = Date.now();
    const message = status === "failed" ?
      'Failed to complete the operation' :
      status === "in_progress" ?
      'Operation is in progress' :
      status === "success" ?
      `Created ${recordsCreated || 0} records and updated ${recordsUpdated || 0} records` :
      'Unknown status';

    const key = `${USAGE_LOG_PREFIX}${logId}`;
    if (!isNew) {
      const existing = await redis.get<UsageLogEntry>(key);
      
      if (existing) {
        if (agent === AGENTNAMES.prospectFinder) {
          // Update existing log entry
          existing.timestamp = timestamp;
          existing.recordsUpdated = recordsUpdated || 0 + existing.recordsUpdated;
          existing.recordsCreated = recordsCreated || 0 + existing.recordsCreated;
          existing.meetingsBooked = meetingsBooked || 0 + existing.meetingsBooked;
          existing.signature = signature;
          existing.nonce = nonce;
          existing.updatedAt = new Date(timestamp).toISOString();
          if (status === "failed" && (existing.recordsCreated > 0 && existing.recordsUpdated > 0)) {
            //existing.status = "failed";
            existing.responseData = {...existing.responseData, errors: existing.responseData.errors ? existing.responseData.errors++ : 1};
          } else {
            existing.status = status;
            existing.responseData = {
              execution_summary : `${message}`,
              recordsUpdated: Number(recordsUpdated || 0) + existing.recordsUpdated,
              recordsCreated: Number(recordsCreated || 0) + existing.recordsCreated,
              meetingsBooked: Number(meetingsBooked || 0) + existing.meetingsBooked,
              errors: Number(existing.responseData.errors || 0)
            };
          }
          
        } else {
          // Update existing log entry
          existing.timestamp = timestamp;
          existing.recordsUpdated = recordsUpdated || 0;
          existing.recordsCreated = recordsCreated || 0;
          existing.meetingsBooked = meetingsBooked || 0;
          existing.signature = signature;
          existing.nonce = nonce;
          existing.updatedAt = new Date(timestamp).toISOString();
          existing.status = status;
          existing.responseData = {
            execution_summary : `${message}`,
            recordsUpdated: Number(recordsUpdated || 0) + existing.recordsUpdated,
            recordsCreated: Number(recordsCreated || 0) + existing.recordsCreated,
            meetingsBooked: Number(meetingsBooked || 0) + existing.meetingsBooked,
            errors: Number(existing.responseData.errors || 0)
          };
        }
        
        await redis.set(`${USAGE_LOG_PREFIX}${logId}`, JSON.stringify(existing));
        return logId;
      }
    }

    const usageLog: UsageLogEntry = {
      timestamp,
      userSub,
      agent,
      recordsUpdated: recordsUpdated || 0,
      recordsCreated: recordsCreated || 0,
      meetingsBooked,
      signature,
      nonce,
      status,
      createdAt: new Date(timestamp).toISOString(),
      updatedAt: new Date(timestamp).toISOString(),
      responseData: {
        execution_summary : `${message}`,
        recordsUpdated,
        recordsCreated,
        meetingsBooked,
        errors: 0
      },
    };

    // Store log with unique ID
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

/**
 * Get the total number of record operations (created + updated) for the current user in a given month
 * @param year - The year to calculate totals for
 * @param month - The month to calculate totals for (0-11, where 0 is January)
 * @returns The total number of record operations
 */
export async function getMonthlyRecordOperationsTotal(
  year: number,
  month: number
): Promise<number> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.error("No session found");
      return 0;
    }
    
    const userSub = session.user.auth0.sub;
    return await getMonthlyRecordOperationsTotalBySub(userSub, year, month);
  } catch (error) {
    console.error("Error retrieving monthly record operations total:", error);
    return 0;
  }
}

/**
 * Get the total number of record operations (created + updated) for a specific user in a given month
 * @param sub - The user sub ID
 * @param year - The year to calculate totals for
 * @param month - The month to calculate totals for (0-11, where 0 is January)
 * @returns The total number of record operations
 */
export async function getMonthlyRecordOperationsTotalBySub(
  sub: string,
  year: number,
  month: number
): Promise<number> {
  try {
    // Calculate start and end timestamps for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of month
    
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    // Get usage summary for the specified time period
    const summary = await getUsageSummaryBySub(sub, startTime, endTime);
    
    // Return the sum of records created and updated
    return summary.recordsCreated + summary.recordsUpdated;
  } catch (error) {
    console.error("Error retrieving monthly record operations total by sub:", error);
    return 0;
  }
}
