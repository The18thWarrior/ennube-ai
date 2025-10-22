/**
 * Utility functions for managing license relationships in PostgreSQL
 */
import { Pool } from 'pg';
import { auth } from '@/auth';

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

// Table name for licenses
const LICENSE_TABLE = "licenses";

export type LicenseStatus = 'active' | 'inactive';

export interface License {
  id?: number;
  subId: string;
  parentSubId?: string;
  status?: LicenseStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create a new license record
 */
export async function createLicense(
  subId: string,
  parentSubId?: string,
  status: LicenseStatus = 'active'
): Promise<number | null> {
  try {
    if (!subId) {
      console.log("Cannot create license: No subscription ID provided");
      return null;
    }
    
    const result = await pool.query(
      `INSERT INTO ${LICENSE_TABLE} (sub_id, parent_sub_id, status)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [subId, parentSubId || null, status]
    );
    
    if (result.rows.length > 0) {
      console.log(`License created with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    }
    
    return null;
  } catch (error) {
    console.log("Error creating license:", error);
    return null;
  }
}

/**
 * Get a license by subscription ID
 */
export async function getLicenseBySubId(subId: string): Promise<License | null> {
  try {
    if (!subId) {
      console.log("Cannot get license: No subscription ID provided");
      return null;
    }
    
    const result = await pool.query(
      `SELECT 
         id,
         sub_id as "subId",
         parent_sub_id as "parentSubId",
         status,
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM ${LICENSE_TABLE}
       WHERE sub_id = $1`,
      [subId]
    );
    
    if (result.rows.length > 0) {
      return mapDbToLicense(result.rows[0]);
    }
    
    return null;
  } catch (error) {
    console.log("Error getting license by subscription ID:", error);
    return null;
  }
}

/**
 * Get all licenses for a parent subscription ID
 */
export async function getLicensesByParentSubId(parentSubId: string): Promise<License[]> {
  try {
    if (!parentSubId) {
      console.log("Cannot get licenses: No parent subscription ID provided");
      return [];
    }
    
    const result = await pool.query(
      `SELECT 
         id,
         sub_id as "subId",
         parent_sub_id as "parentSubId",
         status,
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM ${LICENSE_TABLE}
       WHERE parent_sub_id = $1
       ORDER BY created_at DESC`,
      [parentSubId]
    );
    
    return result.rows.map(mapDbToLicense);
  } catch (error) {
    console.log("Error getting licenses by parent subscription ID:", error);
    return [];
  }
}

/**
 * Get all licenses with a specific status
 */
export async function getLicensesByStatus(status: LicenseStatus): Promise<License[]> {
  try {
    const result = await pool.query(
      `SELECT 
         id,
         sub_id as "subId",
         parent_sub_id as "parentSubId",
         status,
         created_at as "createdAt",
         updated_at as "updatedAt"
       FROM ${LICENSE_TABLE}
       WHERE status = $1
       ORDER BY created_at DESC`,
      [status]
    );
    
    return result.rows.map(mapDbToLicense);
  } catch (error) {
    console.log(`Error getting licenses with status '${status}':`, error);
    return [];
  }
}

/**
 * Get license for the current authenticated user
 */
export async function getCurrentUserLicense(): Promise<License | null> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.sub) {
      console.log("No session found");
      return null;
    }
    
    const userSub = session.user.sub;
    return await getLicenseBySubId(userSub);
  } catch (error) {
    console.log("Error retrieving current user license:", error);
    return null;
  }
}

/**
 * Update a license with a new parent subscription ID
 */
export async function updateLicenseParent(
  subId: string,
  parentSubId: string | null
): Promise<boolean> {
  try {
    if (!subId) {
      console.log("Cannot update license: No subscription ID provided");
      return false;
    }
    
    await pool.query(
      `UPDATE ${LICENSE_TABLE}
       SET parent_sub_id = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE sub_id = $2`,
      [parentSubId, subId]
    );
    
    return true;
  } catch (error) {
    console.log("Error updating license parent:", error);
    return false;
  }
}

/**
 * Update the status of a license
 */
export async function updateLicenseStatus(
  subId: string,
  status: LicenseStatus
): Promise<boolean> {
  try {
    if (!subId) {
      console.log("Cannot update license status: No subscription ID provided");
      return false;
    }
    
    await pool.query(
      `UPDATE ${LICENSE_TABLE}
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE sub_id = $2`,
      [status, subId]
    );
    
    return true;
  } catch (error) {
    console.log("Error updating license status:", error);
    return false;
  }
}

/**
 * Delete a license by subscription ID
 */
export async function deleteLicense(subId: string): Promise<boolean> {
  try {
    if (!subId) {
      console.log("Cannot delete license: No subscription ID provided");
      return false;
    }
    
    const result = await pool.query(
      `DELETE FROM ${LICENSE_TABLE}
       WHERE sub_id = $1
       RETURNING id`,
      [subId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.log("Error deleting license:", error);
    return false;
  }
}

/**
 * Count the number of licenses for a parent subscription ID
 */
export async function countLicensesByParent(parentSubId: string): Promise<number> {
  try {
    if (!parentSubId) {
      console.log("Cannot count licenses: No parent subscription ID provided");
      return 0;
    }
    
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM ${LICENSE_TABLE}
       WHERE parent_sub_id = $1`,
      [parentSubId]
    );
    
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.log("Error counting licenses by parent:", error);
    return 0;
  }
}

/**
 * Transfer all licenses from one parent to another
 */
export async function transferLicenses(
  oldParentSubId: string,
  newParentSubId: string
): Promise<number> {
  try {
    if (!oldParentSubId || !newParentSubId) {
      console.log("Cannot transfer licenses: Missing parent subscription IDs");
      return 0;
    }
    
    const result = await pool.query(
      `UPDATE ${LICENSE_TABLE}
       SET parent_sub_id = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE parent_sub_id = $2
       RETURNING id`,
      [newParentSubId, oldParentSubId]
    );
    
    return result.rows.length;
  } catch (error) {
    console.log("Error transferring licenses:", error);
    return 0;
  }
}

/**
 * Helper function to convert database format to our interface format
 */
function mapDbToLicense(dbRow: any): License {
  return {
    id: dbRow.id,
    subId: dbRow.subId,
    parentSubId: dbRow.parentSubId,
    status: dbRow.status as LicenseStatus,
    createdAt: dbRow.createdAt ? new Date(dbRow.createdAt).toISOString() : undefined,
    updatedAt: dbRow.updatedAt ? new Date(dbRow.updatedAt).toISOString() : undefined
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