/**
 * Utility functions for managing agent settings in PostgreSQL
 */
import { Pool } from 'pg';

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

export type FrequencyType = 'business_hours' | 'daily' | 'weekly' | 'monthly';
export type ProviderType = 'sfdc' | 'hubspot' | 'gmail' | 'msoffice';

export interface AgentSetting {
  id?: string;
  userId: string;
  agent: string;
  createdAt: number;
  updatedAt: number;
  active: boolean;
  frequency: FrequencyType;
  batchSize?: number;
  provider: ProviderType;
  customWorkflow?: string;
}

/**
 * Save agent settings to PostgreSQL
 */
export async function saveAgentSetting(agentSetting: Omit<AgentSetting, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    if (!agentSetting.userId) {
      console.log('Cannot save agent setting: No user ID provided');
      return null;
    }

    const now = Date.now();
    const completeAgentSetting: Omit<AgentSetting, 'id'> = {
      ...agentSetting,
      createdAt: now,
      updatedAt: now
    };
    
    // Check if setting for this user and agent already exists
    const checkResult = await pool.query(
      'SELECT id FROM AgentSettings WHERE user_id = $1 AND agent = $2',
      [completeAgentSetting.userId, completeAgentSetting.agent]
    );
    
    if (checkResult.rows.length > 0) {
      // Update existing setting
      const id = checkResult.rows[0].id;
      await pool.query(
        `UPDATE AgentSettings 
         SET active = $1, frequency = $2, updated_at = $3, batch_size = $4, provider = $5
         WHERE id = $6`,
        [
          completeAgentSetting.active, 
          completeAgentSetting.frequency, 
          completeAgentSetting.updatedAt, 
          completeAgentSetting.batchSize || 10, 
          completeAgentSetting.provider,
          id
        ]
      );
      console.log('Agent setting updated:', id);
      return id;
    } else {
      // Insert new setting
      const insertResult = await pool.query(
        `INSERT INTO AgentSettings 
         (user_id, agent, created_at, updated_at, active, frequency, batch_size, provider)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          completeAgentSetting.userId, 
          completeAgentSetting.agent,
          completeAgentSetting.createdAt,
          completeAgentSetting.updatedAt,
          completeAgentSetting.active,
          completeAgentSetting.frequency,
          completeAgentSetting.batchSize || 10, // Default to 10 if not specified
          completeAgentSetting.provider
        ]
      );
      
      const id = insertResult.rows[0].id;
      console.log('Agent setting saved with ID:', id);
      return id;
    }
  } catch (error) {
    console.log('Error saving agent setting:', error);
    return null;
  }
}

/**
 * Get an agent setting by user ID and agent name
 */
export async function getAgentSetting(userId: string, agent: string): Promise<AgentSetting | null> {
  try {
    if (!userId || !agent) {
      console.log('Cannot get agent setting: Missing user ID or agent name');
      return null;
    }
    
    const result = await pool.query(
      `SELECT id, user_id as "userId", agent, created_at as "createdAt", 
              updated_at as "updatedAt", active, frequency, batch_size as "batchSize", provider, custom_workflow as "customWorkflow"
       FROM AgentSettings
       WHERE user_id = $1 AND agent = $2`,
      [userId, agent]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0] as AgentSetting;
    }
    
    return null;
  } catch (error) {
    console.log('Error getting agent setting:', error);
    return null;
  }
}

/**
 * Get all agent settings for a user
 */
export async function getUserAgentSettings(userId: string): Promise<AgentSetting[]> {
  try {
    if (!userId) {
      console.log('Cannot get agent settings: No user ID provided');
      return [];
    }
    
    const result = await pool.query(
      `SELECT id, user_id as "userId", agent, created_at as "createdAt", 
              updated_at as "updatedAt", active, frequency, batch_size as "batchSize", provider, custom_workflow as "customWorkflow"
       FROM AgentSettings
       WHERE user_id = $1
       ORDER BY agent`,
      [userId]
    );
    
    return result.rows as AgentSetting[];
  } catch (error) {
    console.log('Error getting user agent settings:', error);
    return [];
  }
}

/**
 * Update an existing agent setting
 */
export async function updateAgentSetting(
  settingId: string,
  updates: Partial<Pick<AgentSetting, 'active' | 'frequency' | 'batchSize' | 'provider'>>
): Promise<boolean> {
  try {
    if (!settingId) {
      console.log('Cannot update agent setting: No setting ID provided');
      return false;
    }
    
    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (updates.active !== undefined) {
      updateFields.push(`active = $${paramIndex++}`);
      values.push(updates.active);
    }
    
    if (updates.frequency !== undefined) {
      updateFields.push(`frequency = $${paramIndex++}`);
      values.push(updates.frequency);
    }
    
    if (updates.batchSize !== undefined) {
      updateFields.push(`batch_size = $${paramIndex++}`);
      values.push(updates.batchSize);
    }
    
    if (updates.provider !== undefined) {
      updateFields.push(`provider = $${paramIndex++}`);
      values.push(updates.provider);
    }
    
    // Always update the timestamp
    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(Date.now());
    
    // Add the setting ID as the last parameter
    values.push(settingId);
    
    if (updateFields.length === 0) {
      console.warn('No fields to update for agent setting');
      return false;
    }
    
    // Execute the update query
    const result = await pool.query(
      `UPDATE AgentSettings 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING id`,
      values
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.log('Error updating agent setting:', error);
    return false;
  }
}

/**
 * Toggle the active status of an agent setting
 */
export async function toggleAgentActive(settingId: string): Promise<boolean> {
  try {
    if (!settingId) {
      console.log('Cannot toggle agent status: No setting ID provided');
      return false;
    }
    
    const result = await pool.query(
      `UPDATE AgentSettings 
       SET active = NOT active, updated_at = $1
       WHERE id = $2
       RETURNING active`,
      [Date.now(), settingId]
    );
    
    if (result.rows.length > 0) {
      const newStatus = result.rows[0].active;
      console.log(`Agent ${settingId} active status set to: ${newStatus}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('Error toggling agent status:', error);
    return false;
  }
}

/**
 * Delete an agent setting
 */
export async function deleteAgentSetting(settingId: string): Promise<boolean> {
  try {
    if (!settingId) {
      console.log('Cannot delete agent setting: No setting ID provided');
      return false;
    }
    
    const result = await pool.query(
      'DELETE FROM AgentSettings WHERE id = $1 RETURNING id',
      [settingId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.log('Error deleting agent setting:', error);
    return false;
  }
}

/**
 * Delete all agent settings for a specific user
 */
export async function deleteUserAgentSettings(userId: string): Promise<number> {
  try {
    if (!userId) {
      console.log('Cannot delete user agent settings: No user ID provided');
      return 0;
    }
    
    const result = await pool.query(
      'DELETE FROM AgentSettings WHERE user_id = $1 RETURNING id',
      [userId]
    );
    
    const count = result.rows.length;
    console.log(`Deleted ${count} agent settings for user ${userId}`);
    return count;
  } catch (error) {
    console.log('Error deleting user agent settings:', error);
    return 0;
  }
}

/**
 * Get all agent settings where active flag is true
 */
export async function getAllActiveSettings(): Promise<AgentSetting[]> {
  try {
    const result = await pool.query(
      `SELECT id, user_id as "userId", agent, created_at as "createdAt", 
              updated_at as "updatedAt", active, frequency, batch_size as "batchSize", provider, custom_workflow as "customWorkflow"
       FROM AgentSettings
       WHERE active = true
       ORDER BY user_id, agent`
    );
    
    return result.rows as AgentSetting[];
  } catch (error) {
    console.log('Error getting active agent settings:', error);
    return [];
  }
}
