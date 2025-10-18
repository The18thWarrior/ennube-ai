/**
 * Utility functions for managing user profile information in PostgreSQL
 */
import { Session } from 'next-auth';
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

export interface UserProfile {
  name: string;
  email: string;
  company: string;
  jobRole: string;
  updatedAt: number;
}

/**
 * Save a user's profile information to PostgreSQL
 */
export async function saveUserProfile(userSub: string, profile: Omit<UserProfile, 'updatedAt'>): Promise<boolean> {
  try {
    if (!userSub) {
      console.log('Cannot save profile: No user ID provided');
      return false;
    }

    const profileData: UserProfile = {
      ...profile,
      updatedAt: Date.now()
    };
    
    // Check if user already exists
    const checkResult = await pool.query(
      'SELECT COUNT(*) FROM user_profile WHERE user_sub = $1',
      [userSub]
    );
    
    const exists = parseInt(checkResult.rows[0].count) > 0;
    
    if (exists) {
      // Update existing user
      console.log('Updating existing user profile:', userSub);
      await pool.query(
        `UPDATE user_profile 
         SET name = $1, email = $2, company = $3, job_role = $4, updated_at = $5
         WHERE user_sub = $6`,
        [profileData.name, profileData.email, profileData.company, profileData.jobRole, profileData.updatedAt, userSub]
      );
    } else {
      // Insert new user
      console.log('Inserting new user profile:', userSub);
      await pool.query(
        `INSERT INTO user_profile 
         (user_sub, name, email, company, job_role, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userSub, profileData.name, profileData.email, profileData.company, profileData.jobRole, profileData.updatedAt]
      );
    }
    
    console.log('Profile saved:', profileData.updatedAt);
    return true;
  } catch (error) {
    console.log('Error saving user profile:', error);
    return false;
  }
}

/**
 * Get a user's profile information from PostgreSQL
 */
export async function getUserProfile(userSub: string): Promise<UserProfile | null> {
  try {
    if (!userSub) {
      console.log('Cannot get profile: No user ID provided');
      return null;
    }
    
    const result = await pool.query(
      `SELECT name, email, company, job_role as "jobRole", updated_at as "updatedAt"
       FROM user_profile
       WHERE user_sub = $1`,
      [userSub]
    );
    //console.log('Query result:', result.rows);
    if (result.rows.length > 0) {
      return result.rows[0] as UserProfile;
    }
    
    // If we wanted to create a default profile from session (commented out in original)
    // if (session?.user) {
    //   return {
    //     name: session.user.name || '',
    //     email: session.user.email || '',
    //     company: '',
    //     jobRole: '',
    //     updatedAt: Date.now()
    //   };
    // }
    
    return null;
  } catch (error) {
    console.log('Error getting user profile:', error);
    return null;
  }
}

/**
 * Update specific fields in a user's profile
 */
export async function updateUserProfile(
  userSub: string, 
  profileUpdates: Partial<Omit<UserProfile, 'email' | 'updatedAt'>>
): Promise<boolean> {
  try {
    if (!userSub) {
      console.log('Cannot update profile: No user ID provided');
      return false;
    }
    
    // First check if the profile exists
    const checkResult = await pool.query(
      'SELECT * FROM user_profile WHERE user_sub = $1',
      [userSub]
    );
    
    if (checkResult.rows.length === 0) {
      console.log('Cannot update profile: Profile not found');
      return false;
    }
    
    const currentProfile = checkResult.rows[0];
    
    // Build update query dynamically based on provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (profileUpdates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(profileUpdates.name);
    }
    
    if (profileUpdates.company !== undefined) {
      updateFields.push(`company = $${paramIndex++}`);
      values.push(profileUpdates.company);
    }
    
    if (profileUpdates.jobRole !== undefined) {
      updateFields.push(`job_role = $${paramIndex++}`);
      values.push(profileUpdates.jobRole);
    }
    
    // Always update the timestamp
    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(Date.now());
    
    // Add the user_sub as the last parameter
    values.push(userSub);
    
    // Execute the update query
    await pool.query(
      `UPDATE user_profile 
       SET ${updateFields.join(', ')} 
       WHERE user_sub = $${paramIndex}`,
      values
    );
    
    return true;
  } catch (error) {
    console.log('Error updating user profile:', error);
    return false;
  }
}

/**
 * Delete a user's profile
 */
export async function deleteUserProfile(userSub: string): Promise<boolean> {
  try {
    if (!userSub) {
      console.log('Cannot delete profile: No user ID provided');
      return false;
    }
    
    await pool.query(
      'DELETE FROM user_profile WHERE user_sub = $1',
      [userSub]
    );
    
    return true;
  } catch (error) {
    console.log('Error deleting user profile:', error);
    return false;
  }
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
