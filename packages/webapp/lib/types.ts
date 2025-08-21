import Stripe from "stripe";
import { StoredHubSpotCredentials } from "./db/hubspot-storage";

// Define RefreshTokenResponse type for jsforce
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  instance_url?: string;
  id?: string;
  issued_at?: string;
  signature?: string;
}

export interface SalesforceAuthResult {
  success: boolean;
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
  clientId?: string;
  clientSecret?: string;
  userInfo?: {
    id?: string;
    organization_id?: string;
    display_name?: string;
    email?: string;
    organizationId?: string;
  };
  error?: string;
}

export interface SalesforceUserInfo {
  id?: string;
  organization_id?: string;
  display_name?: string;
  email?: string;
  organizationId?: string;
}

export interface SalesforceQueryResult<T> {
  totalSize: number;
  done: boolean;
  records: T[];
  nextRecordsUrl?: string;
}


// Define HubSpotAuthResult type for HubSpot
// Define token response interface
export interface HubSpotRefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface HubSpotAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  clientId?: string;
  clientSecret?: string;
  userInfo?: {
    id?: string;
    email?: string;
    name?: string;
    portalId?: number;
  };
  error?: string;
  credential: StoredHubSpotCredentials | null;
}

export interface HubSpotUserInfo {
  id?: string;
  email?: string;
  name?: string;
  portalId?: number;
}

export interface HubSpotQueryResult<T> {
  totalSize: number;
  done: boolean;
  records: T[];
  nextPageToken?: string;
}

export interface Agent {
  id: string
  name: string
  systemPrompt: string
  description?: string
  avatar?: string
}

export interface SubscriptionStatus {
  id: string;
  customer: string;
  items? : {
    data: Stripe.SubscriptionItem[]
  },
  days_until_due?: number;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid';
}

export interface Execution {
  id: string
  agent_name: string
  image_url: string
  status: string
  execution_time: number | null
  created_at: string
  response_data: any
}

export interface UsageLogEntry {
  id: string;
  timestamp: number;
  userSub: string;
  agent: string;
  recordsUpdated: number;
  recordsCreated: number;
  meetingsBooked: number;
  queriesExecuted: number;
  signature: string;
  nonce: number;
  usage: number;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  responseData?: {
    execution_summary?: string,
    recordsUpdated?: number,
    recordsCreated?: number,
    meetingsBooked?: number,
    queriesExecuted?: number,
    errors?: number,
    errorMessages?: string[],
    errorRecords?: string[],
    records?: string[]
  };
}