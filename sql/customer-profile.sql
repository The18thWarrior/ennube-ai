-- === customer-profile.sql ===
-- Created: 2025-07-24  
-- Purpose: Table for storing customer profile data for account strategy and segmentation
-- Exports: customer_profile
-- Interactions: Used by integration, analytics, and reporting modules
-- Notes: Arrays stored as JSON for flexibility

CREATE TABLE customer_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique identifier for each customer profile
    user_id VARCHAR(255) NOT NULL, -- ID of the user who owns this profile
    customer_profile_name VARCHAR(255) NOT NULL, -- Human-readable name for the customer profile
    common_industries VARCHAR(512) NOT NULL, -- Semicolon-separated list of industries commonly associated with the customer
    frequently_purchased_products VARCHAR(512) NOT NULL, -- Semicolon-separated list of products/services frequently purchased
    geographic_regions VARCHAR(512) NOT NULL, -- Semicolon-separated list of geographic regions relevant to the customer
    average_days_to_close INTEGER CHECK (average_days_to_close >= 0), -- Average number of days to close a deal
    social_media_presence VARCHAR(256), -- Semicolon-separated list describing social media presence (e.g., Strong, Weak)
    channel_recommendation VARCHAR(256), -- Semicolon-separated list of recommended marketing/sales channels
    account_strategy TEXT, -- Recommended strategy for closing the account
    account_employee_size VARCHAR(32), -- Employee size range for the account (e.g., 5-10)
    account_lifecycle VARCHAR(32), -- Lifecycle stage of the account (e.g., Enterprise)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the profile was created
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp when the profile was last updated
);

/**
 * OVERVIEW
 *
 * - Purpose: Stores customer profile attributes for segmentation, targeting, and analytics.
 * - Assumptions: Arrays (industries, products, regions, channels, social media) stored as JSONB for flexibility.
 * - Edge Cases: Large arrays, missing optional fields, future schema changes.
 * - How it fits: Used by integrations, analytics, and reporting modules for account strategy.
 * - Future Improvements: Normalize arrays into separate tables for scalability if needed.
 */

-- Column descriptions
COMMENT ON COLUMN customer_profile.id IS 'Unique identifier for each customer profile';
COMMENT ON COLUMN customer_profile.user_id IS 'ID of the user who owns this profile';
COMMENT ON COLUMN customer_profile.customer_profile_name IS 'Human-readable name for the customer profile';
COMMENT ON COLUMN customer_profile.common_industries IS 'Semicolon-separated list of industries commonly associated with the customer';
COMMENT ON COLUMN customer_profile.frequently_purchased_products IS 'Semicolon-separated list of products/services frequently purchased';
COMMENT ON COLUMN customer_profile.geographic_regions IS 'Semicolon-separated list of geographic regions relevant to the customer';
COMMENT ON COLUMN customer_profile.average_days_to_close IS 'Average number of days to close a deal';
COMMENT ON COLUMN customer_profile.social_media_presence IS 'Semicolon-separated list describing social media presence (e.g., Strong, Weak)';
COMMENT ON COLUMN customer_profile.channel_recommendation IS 'Semicolon-separated list of recommended marketing/sales channels';
COMMENT ON COLUMN customer_profile.account_strategy IS 'Recommended strategy for closing the account';
COMMENT ON COLUMN customer_profile.account_employee_size IS 'Employee size range for the account (e.g., 5-10)';
COMMENT ON COLUMN customer_profile.account_lifecycle IS 'Lifecycle stage of the account (e.g., Enterprise)';
COMMENT ON COLUMN customer_profile.created_at IS 'Timestamp when the profile was created';
COMMENT ON COLUMN customer_profile.updated_at IS 'Timestamp when the profile was last updated';


/*
 * === customer-profile.sql ===
 * Updated: 2025-07-24
 * Summary: Defines customer_profile table for storing account strategy and segmentation data.
 * Key Components:
 *   - customer_profile: Main table for customer profile attributes
 * Dependencies:
 *   - Requires: PostgreSQL >= 12
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Arrays stored as JSONB for flexibility
 */
