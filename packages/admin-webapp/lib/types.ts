// === types.ts ===
// Created: 2025-08-29 10:00
// Purpose: TypeScript interfaces for all database tables
// Exports: All table interfaces and enums
// Interactions: Used by database service, components, and API routes
// Notes: Matches SQL schema definitions exactly

/**
 * OVERVIEW
 *
 * - Purpose: Defines TypeScript types for all database tables
 * - Assumptions: Matches SQL schema exactly, uses consistent naming
 * - Edge Cases: Optional fields, enum values, JSONB types
 * - How it fits: Foundation for type safety across the entire app
 * - Future Improvements: Generate from SQL schema automatically
 */

// Enums matching SQL definitions
export type FrequencyType = 'business_hours' | 'daily' | 'weekly' | 'monthly';
export type ProviderType = 'sfdc' | 'hubspot' | 'gmail' | 'msoffice';
export type CredentialType = 'sfdc' | 'hubspot' | 'gsuite' | 'postgres';
export type StatusType = 'active' | 'inactive';

// User Profile interface
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  company: string;
  job_role: string;
  updated_at: number;
  created_at: string;
}

// Customer Profile interface
export interface CustomerProfile {
  id: string;
  user_id: string;
  active: boolean;
  customer_profile_name: string;
  common_industries: string;
  frequently_purchased_products: string;
  geographic_regions: string;
  average_days_to_close: number | null;
  social_media_presence: string | null;
  channel_recommendation: string | null;
  account_strategy: string | null;
  account_employee_size: string | null;
  account_lifecycle: string | null;
  created_at: string;
  updated_at: string;
}

// Agent Settings interface
export interface AgentSettings {
  id: string;
  user_id: string;
  agent: string;
  created_at: number;
  updated_at: number;
  batch_size: number;
  active: boolean;
  frequency: FrequencyType;
  provider: ProviderType;
}

// API Keys interface
export interface ApiKey {
  id: string;
  user_id: string;
  hash: string;
  created_at: string;
  updated_at: string;
}

// License interface
export interface License {
  id: number;
  sub_id: string;
  parent_sub_id: string | null;
  updated_at: string;
  created_at: string;
  status: StatusType;
}

// Credentials interface
export interface Credential {
  id: string;
  user_id: string;
  type: CredentialType;
  access_token: string;
  instance_url: string;
  refresh_token: string | null;
  user_info_id: string | null;
  user_info_organization_id: string | null;
  user_info_display_name: string | null;
  user_info_email: string | null;
  user_info_organization_id_alt: string | null;
  account_timestamp_field: string | null;
  created_at: number;
  expires_at: number;
  created_timestamp: string;
}

// Outcomes interface
export interface Outcome {
  id: string;
  user_id: string;
  agent: string;
  status: string;
  run_id: string | null;
  outcome_data: Record<string, any> | null;
  created_at: number;
  updated_at: number;
}

// Usage Log interface
export interface UsageLog {
  id: string;
  timestamp: number;
  user_sub: string;
  agent: string;
  records_updated: number;
  records_created: number;
  meetings_booked: number;
  queries_executed: number;
  usage: number;
  signature: string;
  nonce: number;
  created_at: string;
  updated_at: string;
  status: string | null;
  archived: boolean;
  response_data: Record<string, any> | null;
}

// Contract Results interface
export interface ContractResult {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: number;
  source_id: string;
  provider: string;
  contract_data: Record<string, any>;
}

// Outcome Log interface
export interface OutcomeLog {
  id: string;
  outcome_id: string;
  timestamp: number;
  action: string;
  summary: string;
  messages: Record<string, any> | null;
}

// Form interfaces for creating/updating records
export interface CreateUserProfileData {
  name: string;
  email: string;
  company: string;
  job_role: string;
}

export interface CreateCustomerProfileData {
  user_id: string;
  active: boolean;
  customer_profile_name: string;
  common_industries: string;
  frequently_purchased_products: string;
  geographic_regions: string;
  average_days_to_close?: number;
  social_media_presence?: string;
  channel_recommendation?: string;
  account_strategy?: string;
  account_employee_size?: string;
  account_lifecycle?: string;
}

export interface CreateAgentSettingsData {
  user_id: string;
  agent: string;
  batch_size: number;
  active: boolean;
  frequency: FrequencyType;
  provider: ProviderType;
}

export interface CreateApiKeyData {
  user_id: string;
  hash: string;
}

export interface CreateLicenseData {
  sub_id: string;
  parent_sub_id?: string;
  status: StatusType;
}

export interface CreateCredentialData {
  user_id: string;
  type: CredentialType;
  access_token: string;
  instance_url: string;
  refresh_token?: string;
  user_info_id?: string;
  user_info_organization_id?: string;
  user_info_display_name?: string;
  user_info_email?: string;
  user_info_organization_id_alt?: string;
  account_timestamp_field?: string;
  expires_at: number;
}

export interface CreateOutcomeData {
  user_id: string;
  agent: string;
  status: string;
  run_id?: string;
  outcome_data?: Record<string, any>;
}

export interface CreateUsageLogData {
  id: string;
  timestamp: number;
  user_sub: string;
  agent: string;
  records_updated?: number;
  records_created?: number;
  meetings_booked?: number;
  queries_executed?: number;
  usage?: number;
  signature: string;
  nonce: number;
  status?: string;
  archived?: boolean;
  response_data?: Record<string, any>;
}

export interface CreateContractResultData {
  user_id: string;
  source_id: string;
  provider: string;
  contract_data: Record<string, any>;
}

export interface CreateOutcomeLogData {
  outcome_id: string;
  action: string;
  summary: string;
  messages?: Record<string, any>;
}

// Pagination and search interfaces
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/*
 * === types.ts ===
 * Updated: 2025-08-29 10:00
 * Summary: Complete TypeScript interfaces for all database tables
 * Key Components:
 *   - UserProfile, CustomerProfile, AgentSettings, etc.
 *   - Create/Update data interfaces
 *   - API and pagination types
 * Dependencies:
 *   - Requires: None (foundation types)
 * Version History:
 *   v1.0 – initial complete schema
 * Notes:
 *   - Matches SQL schema exactly
 *   - Includes form and API types
 */
