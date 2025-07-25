// === customer-profile.ts ===
// Created: 2025-07-24 14:00
// Purpose: Utility functions for managing customer profiles in PostgreSQL
// Exports:
//   - CustomerProfile
//   - saveCustomerProfile
//   - getCustomerProfile
//   - getUserCustomerProfiles
//   - updateCustomerProfile
//   - deleteCustomerProfile
// Interactions:
//   - Used by: integrations, analytics, reporting modules
// Notes:
//   - Semicolon-separated strings for array fields

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true
});

export interface CustomerProfile {
  id?: string;
  userId: string;
  customerProfileName: string;
  commonIndustries: string; // semicolon-separated
  frequentlyPurchasedProducts: string; // semicolon-separated
  geographicRegions: string; // semicolon-separated
  averageDaysToClose: number;
  socialMediaPresence?: string; // semicolon-separated
  channelRecommendation?: string; // semicolon-separated
  accountStrategy?: string;
  accountEmployeeSize?: string;
  accountLifecycle?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Save a customer profile to PostgreSQL
 */
export async function saveCustomerProfile(profile: Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    if (!profile.userId || !profile.customerProfileName) {
      console.error('Cannot save customer profile: Missing userId or customerProfileName');
      return null;
    }
    const now = new Date().toISOString();
    const insertResult = await pool.query(
      `INSERT INTO customer_profile (
        user_id, customer_profile_name, common_industries, frequently_purchased_products, geographic_regions,
        average_days_to_close, social_media_presence, channel_recommendation, account_strategy, account_employee_size, account_lifecycle, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING id`,
      [
        profile.userId,
        profile.customerProfileName,
        profile.commonIndustries,
        profile.frequentlyPurchasedProducts,
        profile.geographicRegions,
        profile.averageDaysToClose,
        profile.socialMediaPresence || null,
        profile.channelRecommendation || null,
        profile.accountStrategy || null,
        profile.accountEmployeeSize || null,
        profile.accountLifecycle || null,
        now,
        now
      ]
    );
    return insertResult.rows[0].id;
  } catch (error) {
    console.error('Error saving customer profile:', error);
    return null;
  }
}

/**
 * Get a customer profile by ID
 */
export async function getCustomerProfile(id: string): Promise<CustomerProfile | null> {
  try {
    if (!id) {
      console.error('Cannot get customer profile: No ID provided');
      return null;
    }
    const result = await pool.query(
      `SELECT id, user_id as "userId", customer_profile_name as "customerProfileName", common_industries as "commonIndustries",
              frequently_purchased_products as "frequentlyPurchasedProducts", geographic_regions as "geographicRegions",
              average_days_to_close as "averageDaysToClose", social_media_presence as "socialMediaPresence",
              channel_recommendation as "channelRecommendation", account_strategy as "accountStrategy",
              account_employee_size as "accountEmployeeSize", account_lifecycle as "accountLifecycle",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM customer_profile WHERE id = $1`,
      [id]
    );
    if (result.rows.length > 0) {
      return result.rows[0] as CustomerProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting customer profile:', error);
    return null;
  }
}

/**
 * Get all customer profiles for a user
 */
export async function getUserCustomerProfiles(userId: string): Promise<CustomerProfile[]> {
  try {
    if (!userId) {
      console.error('Cannot get customer profiles: No userId provided');
      return [];
    }
    const result = await pool.query(
      `SELECT id, user_id as "userId", customer_profile_name as "customerProfileName", common_industries as "commonIndustries",
              frequently_purchased_products as "frequentlyPurchasedProducts", geographic_regions as "geographicRegions",
              average_days_to_close as "averageDaysToClose", social_media_presence as "socialMediaPresence",
              channel_recommendation as "channelRecommendation", account_strategy as "accountStrategy",
              account_employee_size as "accountEmployeeSize", account_lifecycle as "accountLifecycle",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM customer_profile WHERE user_id = $1 ORDER BY customer_profile_name`,
      [userId]
    );
    return result.rows as CustomerProfile[];
  } catch (error) {
    console.error('Error getting user customer profiles:', error);
    return [];
  }
}

/**
 * Update an existing customer profile
 */
export async function updateCustomerProfile(id: string, updates: Partial<Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
  try {
    if (!id) {
      console.error('Cannot update customer profile: No ID provided');
      return false;
    }
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    for (const [key, value] of Object.entries(updates)) {
      updateFields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramIndex++}`);
      values.push(value);
    }
    updateFields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());
    values.push(id);
    if (updateFields.length === 0) {
      console.warn('No fields to update for customer profile');
      return false;
    }
    const result = await pool.query(
      `UPDATE customer_profile SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id`,
      values
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error updating customer profile:', error);
    return false;
  }
}

/**
 * Delete a customer profile by ID
 */
export async function deleteCustomerProfile(id: string): Promise<boolean> {
  try {
    if (!id) {
      console.error('Cannot delete customer profile: No ID provided');
      return false;
    }
    const result = await pool.query(
      'DELETE FROM customer_profile WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error deleting customer profile:', error);
    return false;
  }
}

/**
 * OVERVIEW
 *
 * - Purpose: Manage customer profile records in PostgreSQL for segmentation, analytics, and reporting.
 * - Assumptions: Semicolon-separated strings for array fields. UUID for primary key.
 * - Edge Cases: Missing required fields, invalid data types, update conflicts.
 * - How it fits: Used by integrations, analytics, and reporting modules.
 * - Future Improvements: Add search/filter, pagination, and normalization of array fields.
 */

/*
 * === customer-profile.ts ===
 * Updated: 2025-07-24 14:00
 * Summary: Implements CRUD operations for customer_profile table.
 * Key Components:
 *   - CustomerProfile: Type definition
 *   - CRUD functions: save, get, update, delete
 * Dependencies:
 *   - Requires: pg, PostgreSQL >= 12
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Semicolon-separated strings for array fields
 */
