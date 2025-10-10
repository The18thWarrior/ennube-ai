// === log-storage.ts ===
// Created: 2025-09-21 12:00
// Purpose: Utility functions for managing logs in MongoDB
// Exports:
//   - insertLog(log: Omit<Log, 'id' | 'created'>): Promise<string>
//   - getLogsByUserId(userId: string): Promise<Log[]>
//   - getLogsByUserIdAndTimeframe(userId: string, startTime: number, endTime: number): Promise<Log[]>
//   - getAllLogs(): Promise<Log[]>
// Interactions:
//   - Uses MongoDB 'logs' collection
// Notes:
//   - Requires MONGO_CONNECTION_STRING environment variable
//   - Every log must have a userId
'use server';
import { MongoClient, Db, Collection } from 'mongodb';

export interface Log {
  id: string; // UUID
  userId: string;
  type: 'query' | 'save' | 'action' | 'chat';
  action?: string;
  created: number; // Unix timestamp
  credits: number;
}

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Get MongoDB database connection
 */
export async function getDatabase(): Promise<Db> {
  if (!db) {
    const connectionString = process.env.MONGO_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('MONGO_CONNECTION_STRING environment variable is not set');
    }
    console.log('connecting to MongoDB...', connectionString);
    client = new MongoClient(connectionString, {
      // good practice in Next dev to avoid too many sockets
      maxPoolSize: 10,
    });
    await client.connect();
    console.log('client connected to MongoDB');
    db = client.db('dev'); // Use default database from connection string
    console.log('connected to MongoDB database:', db.databaseName);
  }
  return db;
}

/**
 * Get logs collection
 */
async function getLogsCollection(): Promise<Collection<Log>> {
  const database = await getDatabase();
  return database.collection<Log>('logs');
}

/**
 * Insert a new log entry
 * @param logData - Log data without id and created timestamp
 * @returns The generated UUID of the inserted log
 */
export async function insertLog(logData: Omit<Log, 'id' | 'created'>): Promise<string> {
  try {
    if (!logData.userId) {
      throw new Error('userId is required for all logs');
    }

    const collection = await getLogsCollection();
    console.log('log collection retrieved')
    const id = crypto.randomUUID(); // Generate UUID
    const log: Log = {
      ...logData,
      id,
      created: Date.now(),
    };

    await collection.insertOne(log);
    return id;
  } catch (error) {
    console.error('Error inserting log:', error);
    throw error;
  }
}

/**
 * Get all logs for a specific user
 * @param userId - The user ID to filter logs
 * @returns Array of logs for the user
 */
export async function getLogsByUserId(userId: string): Promise<Log[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const collection = await getLogsCollection();
    const logs = await collection.find({ userId }).toArray();
    return logs;
  } catch (error) {
    console.error('Error getting logs by userId:', error);
    throw error;
  }
}

/**
 * Get logs for a specific user within a timeframe
 * @param userId - The user ID to filter logs
 * @param startTime - Start timestamp (inclusive)
 * @param endTime - End timestamp (inclusive)
 * @returns Array of logs for the user within the specified timeframe
 */
export async function getLogsByUserIdAndTimeframe(userId: string, startTime: number, endTime: number): Promise<Log[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }
    if (startTime > endTime) {
      throw new Error('startTime must be less than or equal to endTime');
    }

    const collection = await getLogsCollection();
    const logs = await collection.find({
      userId,
      created: {
        $gte: startTime,
        $lte: endTime
      }
    }).toArray();
    return logs;
  } catch (error) {
    console.error('Error getting logs by userId and timeframe:', error);
    throw error;
  }
}
export async function getAllLogs(): Promise<Log[]> {
  try {
    const collection = await getLogsCollection();
    const logs = await collection.find({}).toArray();
    return logs;
  } catch (error) {
    console.error('Error getting all logs:', error);
    throw error;
  }
}

/**
 * Close MongoDB connection
 */
export async function closeConnection(): Promise<void> {
  try {
    if (client) {
      await client.close();
      client = null;
      db = null;
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

/**
 * OVERVIEW
 *
 * - Purpose: Provides database operations for the logs collection in MongoDB
 * - Assumptions: MONGO_CONNECTION_STRING is set, MongoDB is accessible
 * - Edge Cases: Handles missing userId, connection failures, invalid timeframes
 * - How it fits into the system: Used by application logic to store and retrieve user activity logs
 * - Future Improvements: Add pagination, filtering by log type, aggregation queries
 */

/*
 * === log-storage.ts ===
 * Updated: 2025-09-21 12:15
 * Summary: MongoDB storage utilities for logs collection
 * Key Components:
 *   - insertLog(): Inserts a new log entry with generated UUID
 *   - getLogsByUserId(): Retrieves logs for a specific user
 *   - getLogsByUserIdAndTimeframe(): Retrieves logs for a user within a specific timeframe
 *   - getAllLogs(): Retrieves all logs (admin use)
 *   - closeConnection(): Closes the MongoDB connection
 * Dependencies:
 *   - mongodb package
 *   - MONGO_CONNECTION_STRING environment variable
 * Version History:
 *   v1.0 – initial implementation
 *   v1.1 – added getLogsByUserIdAndTimeframe method
 * Notes:
 *   - All logs require a userId
 *   - Uses UUID for log IDs
 */

