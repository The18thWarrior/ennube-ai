/**
 * Utility functions for managing usage logs in PostgreSQL for billing purposes
 */
import { Pool } from 'pg';
import { nanoid } from "nanoid";
import { auth } from '@/auth';
import { UsageLogEntry } from '../types';

const AGENTNAMES = {
  prospectFinder: 'ProspectFinder',
  dataSteward: 'DataSteward',
}

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

// Table name for usage logs
const USAGE_LOG_TABLE = "usage_log";

interface StoreUsageParams {
  userSub: string,
  agent: string,
  recordsUpdated: number | null,
  recordsCreated: number | null,
  meetingsBooked: number | null,
  queriesExecuted: number | null,
  signature: string | null,
  nonce: number | null,
  logId: string | null,
  isNew: boolean | null,
  status: string | null,
  errors: string[] | null,
  recordId: string | null,
}

/**
 * Store usage log entry in PostgreSQL
 */
export async function storeUsageLog(
  params: StoreUsageParams
): Promise<string | null> {
  try {
    console.log("Storing usage log with params:", params)
    const timestamp = Date.now();
    const message = getMessage(params.status || "In Progress", params.agent, params.recordsCreated || 0, params.recordsUpdated || 0);
    const logId = params.logId || nanoid();
    
    // Check if this is an update to an existing log
    if (!params.isNew) {
      // Check if log exists
      const existingResult = await pool.query(
        `SELECT * FROM ${USAGE_LOG_TABLE} WHERE id = $1`,
        [logId]
      );
      
      if (existingResult.rows.length > 0) {
        const existing = mapDbToUsageLogEntry(existingResult.rows[0]);
        
        if (params.agent === AGENTNAMES.prospectFinder) {
          // Update existing log entry
          const newMessage = getMessage(params.status || "In Progress", params.agent, params.recordsCreated || 0, params.recordsUpdated || 0, existing);
          const recordsUpdated = Number(params.recordsUpdated || 0) + Number(existing.recordsUpdated);
          const recordsCreated = Number(params.recordsCreated || 0) + Number(existing.recordsCreated);
          const meetingsBooked = Number(params.meetingsBooked || 0) + Number(existing.meetingsBooked);
          const queriesExecuted = Number(params.queriesExecuted || 0) + Number(existing.queriesExecuted);
          const responseData = existing.responseData || {};
          const errorCount = Number(params.errors ? params.errors.length : 0) + Number(responseData.errorMessages ? responseData.errorMessages.length : 0);
          
          let updatedResponseData;
          const usage = recordsCreated + recordsUpdated + meetingsBooked + queriesExecuted;
          if (params.status === "failed" && (existing.recordsCreated > 0 || existing.recordsUpdated > 0)) {
            updatedResponseData = {
              ...responseData,
              usage,
              execution_summary: newMessage,
              errors: errorCount,
              errorMessages: [...(responseData.errorMessages || []), ...(params.errors ? [...params.errors] : [])],
              errorRecords: [...(responseData.errorRecords || []), ...(params.recordId ? [params.recordId] : [])],
            };
          } else if (params.status === "failed") {
            updatedResponseData = {
              ...responseData,
              usage,
              execution_summary: newMessage,
              errors: errorCount,
              errorMessages: [...(responseData.errorMessages || []), ...(params.errors ? [...params.errors] : [])],
              errorRecords: [...(responseData.errorRecords || []), ...(params.recordId ? [params.recordId] : [])],
            };
          } else {
            // Update response data with new values
            updatedResponseData = {
              execution_summary: newMessage,
              recordsUpdated: recordsUpdated,
              recordsCreated: recordsCreated,
              meetingsBooked: meetingsBooked,
              queriesExecuted: queriesExecuted,
              usage,
              errorMessages: [...(responseData.errorMessages || [])],
              errors: Number(responseData.errors || 0),
              records: params.recordId 
                ? [...(responseData.records || []), params.recordId] 
                : (responseData.records || []),
              errorRecords: [...(responseData.errorRecords || [])]
            };
          }
          
          // Update the database record
          await pool.query(
            `UPDATE ${USAGE_LOG_TABLE} 
             SET records_updated = $1, 
                 records_created = $2, 
                 meetings_booked = $3, 
                 queries_executed = $4,
                 signature = $5, 
                 nonce = $6, 
                 updated_at = NOW(), 
                 status = $7, 
                 usage = $8,
                 response_data = $9
             WHERE id = $10`,
            [
              recordsUpdated,
              recordsCreated,
              meetingsBooked,
              queriesExecuted,
              params.signature || existing.signature,
              params.nonce || existing.nonce,
              params.status === "failed" && (existing.recordsCreated > 0 || existing.recordsUpdated > 0) 
                ? existing.status 
                : params.status || existing.status,
              usage,
              JSON.stringify(updatedResponseData),
              logId
            ]
          );
        } else {
          // Update existing log entry for other agents
          const recordsUpdated = Number(params.recordsUpdated || 0) + Number(existing.recordsUpdated);
          const recordsCreated = Number(params.recordsCreated || 0) + Number(existing.recordsCreated);
          const meetingsBooked = Number(params.meetingsBooked || 0) + Number(existing.meetingsBooked);
          const queriesExecuted = Number(params.queriesExecuted || 0) + Number(existing.queriesExecuted);
          const usage = recordsCreated + recordsUpdated + meetingsBooked + queriesExecuted;
          
          const responseData = existing.responseData || {};
          const updatedResponseData = {
            execution_summary: message,
            recordsUpdated: recordsUpdated,
            recordsCreated: recordsCreated,
            meetingsBooked: meetingsBooked,
            queriesExecuted: queriesExecuted,
            usage,
            errors: Number(responseData.errors || 0),
            records: params.recordId
              ? [...(responseData.records || []), ...(params.status !== 'failed' ? [params.recordId] : [])]
              : (responseData.records || []),
            errorMessages: [...(responseData.errorMessages || []), ...(params.errors ? [...params.errors] : [])],
            errorRecords: [...(responseData.errorRecords || []), ...(params.recordId && params.status === "failed" ? [params.recordId] : [])],
          };
          
          // Update the database record
          await pool.query(
            `UPDATE ${USAGE_LOG_TABLE} 
             SET records_updated = $1, 
                 records_created = $2, 
                 meetings_booked = $3, 
                 queries_executed = $4,
                 signature = $5, 
                 nonce = $6, 
                 updated_at = NOW(), 
                 status = $7, 
                 usage = $8,
                 response_data = $9
             WHERE id = $10`,
            [
              recordsUpdated,
              recordsCreated,
              meetingsBooked,
              queriesExecuted,
              params.signature || existing.signature,
              params.nonce || existing.nonce,
              existing.status === "success" ? existing.status : params.status,
              usage,
              JSON.stringify(updatedResponseData),
              logId
            ]
          );
        }
        
        return logId;
      }
    }

    const usage = (params.recordsCreated || 0) + (params.recordsUpdated || 0) + (params.meetingsBooked || 0) + (params.queriesExecuted || 0);
    // Create a new log entry
    const responseData = {
      execution_summary: message,
      recordsUpdated: params.recordsUpdated || 0,
      recordsCreated: params.recordsCreated || 0,
      meetingsBooked: params.meetingsBooked || 0,
      queriesExecuted: params.queriesExecuted || 0,
      usage,
      errors: 0,
      records: params.recordId ? [params.recordId] : [],
      errorMessages: [],
      errorRecords: []
    };

    // Insert the new record
    await pool.query(
      `INSERT INTO ${USAGE_LOG_TABLE} 
       (id, timestamp, user_sub, agent, records_updated, records_created, 
        meetings_booked, queries_executed, signature, nonce, usage, status, response_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        logId,
        timestamp,
        params.userSub,
        params.agent,
        params.recordsUpdated || 0,
        params.recordsCreated || 0,
        params.meetingsBooked || 0,
        params.queriesExecuted || 0,
        params.signature || '',
        params.nonce || 0,
        usage,
        params.status || 'In Progress',
        JSON.stringify(responseData)
      ]
    );

    return logId;
  } catch (error) {
    console.log("Error storing usage log:", error);
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
      console.log("No session found");
      return [];
    }
    
    const userSub = session.user.sub;
    return await getUserUsageLogsBySub(userSub, limit, offset);
  } catch (error) {
    console.log("Error retrieving user usage logs:", error);
    return [];
  }
}

/**
 * Retrieve usage logs for the current authenticated user
 */
export async function getUserUsageLog(
  usageId: string
): Promise<UsageLogEntry | null> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.log("No session found");
      return null;
    }
    
    const userSub = session.user.sub;
    const result = await pool.query(
      `SELECT * FROM ${USAGE_LOG_TABLE} 
       WHERE user_sub = $1
       AND id = $2
       AND archived = FALSE`,
      [userSub, usageId]
    );

    if (result.rows.length > 0) {
      return mapDbToUsageLogEntry(result.rows[0]);
    }

    return null;
  } catch (error) {
    console.log("Error retrieving user usage log:", error);
    return null;
  }
}


/**
 * Retrieve usage logs for a specific user by their sub ID
 */
export async function getUserUsageLogsBySub(
  sub: string,
  limit: number = 100,
  offset: number = 0,
  filter?: string
): Promise<UsageLogEntry[]> {
  try {
    //console.log('getUserUsageLogsBySub called with:', { sub, limit, offset, filter });
    if (filter && filter.length > 0) {
      const result = await pool.query(
        `SELECT * FROM ${USAGE_LOG_TABLE} 
        WHERE user_sub = $1 AND agent = $4 AND archived = FALSE
        ORDER BY timestamp DESC
        LIMIT $2 OFFSET $3`,
        [sub, limit, offset, filter]
      );
      
      // Map the results to our interface format
      return result.rows.map(mapDbToUsageLogEntry);
    }
    const result = await pool.query(
      `SELECT * FROM ${USAGE_LOG_TABLE} 
       WHERE user_sub = $1 AND archived = FALSE
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [sub, limit, offset]
    );
    
    // Map the results to our interface format
    return result.rows.map(mapDbToUsageLogEntry);
  } catch (error) {
    console.log("Error retrieving usage logs by sub:", error);
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
  queriesExecuted: number;
}> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.log("No session found");
      return { recordsUpdated: 0, recordsCreated: 0, meetingsBooked: 0, queriesExecuted: 0 };
    }
    
    const userSub = session.user.sub;
    return await getUsageSummaryBySub(userSub, startTime, endTime);
  } catch (error) {
    console.log("Error retrieving usage summary:", error);
    return { recordsUpdated: 0, recordsCreated: 0, meetingsBooked: 0, queriesExecuted: 0 };
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
  queriesExecuted: number;
  usage?: number;
}> {
  try {
    // Query the database directly for the summary
    const result = await pool.query(
      `SELECT 
         SUM(records_updated) as records_updated,
         SUM(records_created) as records_created,
         SUM(meetings_booked) as meetings_booked,
         SUM(queries_executed) as queries_executed,
         SUM(usage) as usage
       FROM ${USAGE_LOG_TABLE}
       WHERE user_sub = $1 
         AND timestamp >= $2 
         AND timestamp <= $3`,
      [sub, startTime, endTime]
    );
    
    // Return the summary
    if (result.rows.length > 0) {
      return {
        recordsUpdated: Number(result.rows[0].records_updated || 0),
        recordsCreated: Number(result.rows[0].records_created || 0),
        meetingsBooked: Number(result.rows[0].meetings_booked || 0),
        queriesExecuted: Number(result.rows[0].queries_executed || 0),
        usage: Number(result.rows[0].usage || 0)
      };
    }

    return { recordsUpdated: 0, recordsCreated: 0, meetingsBooked: 0, queriesExecuted: 0, usage: 0 };
  } catch (error) {
    console.log("Error retrieving usage summary by sub:", error);
    return { recordsUpdated: 0, recordsCreated: 0, meetingsBooked: 0, queriesExecuted: 0, usage: 0 };
  }
}

/**
 * Clear all usage logs for a user
 */
export async function clearUserUsageLogs(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      console.log("No session found");
      return false;
    }
    
    const userSub = session.user.sub;
    return await clearUserUsageLogsBySub(userSub);
  } catch (error) {
    console.log("Error clearing user usage logs:", error);
    return false;
  }
}

/**
 * Clear all usage logs for a specific user by their sub ID
 */
export async function clearUserUsageLogsBySub(sub: string): Promise<boolean> {
  try {
    await pool.query(
      `DELETE FROM ${USAGE_LOG_TABLE} WHERE user_sub = $1`,
      [sub]
    );
    
    return true;
  } catch (error) {
    console.log("Error clearing user usage logs by sub:", error);
    return false;
  }
}

/**
 * Clear all usage logs for a specific user by their sub ID
 */
export async function clearUserUsageLogBySub(id: string, sub: string): Promise<boolean> {
  try {
    await pool.query(
      `UPDATE ${USAGE_LOG_TABLE} SET archived = TRUE WHERE id = $1 AND user_sub = $2`,
      [id, sub]
    );
    
    return true;
  } catch (error) {
    console.log("Error clearing user usage logs by sub:", error);
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
      console.log("No session found");
      return 0;
    }
    
    const userSub = session.user.sub;
    return await getMonthlyRecordOperationsTotalBySub(userSub, year, month);
  } catch (error) {
    console.log("Error retrieving monthly record operations total:", error);
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
    
    // Query the database directly for the sum
    const result = await pool.query(
      `SELECT 
         SUM(usage) as total_operations
       FROM ${USAGE_LOG_TABLE}
       WHERE user_sub = $1 
         AND timestamp >= $2 
         AND timestamp <= $3`,
      [sub, startTime, endTime]
    );
    
    // Return the result
    return Number(result.rows[0]?.total_operations || 0);
  } catch (error) {
    console.log("Error retrieving monthly record operations total by sub:", error);
    return 0;
  }
}

/**
 * Helper function to convert database format to our interface format
 */
function mapDbToUsageLogEntry(dbRow: any): UsageLogEntry {
  return {
    id: dbRow.id,
    timestamp: dbRow.timestamp,
    userSub: dbRow.user_sub,
    agent: dbRow.agent,
    recordsUpdated: Number(dbRow.records_updated),
    recordsCreated: Number(dbRow.records_created),
    meetingsBooked: Number(dbRow.meetings_booked),
    queriesExecuted: Number(dbRow.queries_executed),
    signature: dbRow.signature,
    nonce: Number(dbRow.nonce),
    usage: Number(dbRow.usage),
    createdAt: dbRow.created_at ? new Date(dbRow.created_at).toISOString() : undefined,
    updatedAt: dbRow.updated_at ? new Date(dbRow.updated_at).toISOString() : undefined,
    status: dbRow.status,
    responseData: dbRow.response_data
  };
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

const getMessage = (status: string, agent: string, recordsCreated: number, recordsUpdated: number, existing = null as UsageLogEntry | null) => {
  if (agent === AGENTNAMES.prospectFinder && existing) {
    if (existing.recordsCreated > 0 || existing.recordsUpdated > 0) {
      return `Created ${recordsCreated || 0} records and updated ${recordsUpdated || 0} records`;
    }
  }
  return status === "failed" ?
      'Failed to complete the operation' :
      status === "in_progress" ?
      'Operation is in progress' :
      status === "success" ?
      `Created ${recordsCreated || 0} records and updated ${recordsUpdated || 0} records` :
      'Unknown status';
};
