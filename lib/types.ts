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