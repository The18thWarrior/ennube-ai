import Stripe from "stripe";
import { StoredHubSpotCredentials } from "./db/hubspot-storage";
import z from "zod/v4";

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
  describeEmbedUrl?: string;
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

export interface QueryResult {
  id: string;
  payload: Record<string, unknown> | undefined;
  score: number;
}

export type SfdcField = {
  calculatedFormula?: string | null;
  digits?: number | null;
  externalId?: boolean | null;
  inlineHelpText?: string | null;
  label?: string | null;
  length?: number | null;
  name: string;
  picklistValues?: any[]; // keep generic to match jsforce shape; refine if needed
  precision?: number | null;
  relationshipName?: string | null;
  type?: string | null;
};

export type SfdcChildRelationship = {
  childSObject: string;
  field: string;
  relationshipName: string;
};

export type DescribeResultType = {
  name: string;
  label?: string | null;
  keyPrefix?: string | null;
  fields: SfdcField[];
  childRelationships: SfdcChildRelationship[];
};

/**
 * Schema for individual field mapping response
 */
export const FieldMappingSchema = z.object({
  csvField: z.string().describe('The CSV column header name'),
  salesforceField: z.string().describe('The corresponding Salesforce field API name'),
  dataType: z.string().describe('The Salesforce field data type')
});

export const BulkDataLoadMappingSchema = z.object({
  sobject: z.string().describe('The Salesforce object API name'),
  fileUrl: z.string().describe('URL of the CSV file to be processed'),
  dmlOperation: z.enum(['insert', 'update', 'upsert', 'delete']).describe('The type of DML operation to perform'),
  mappings: z.array(FieldMappingSchema).describe('Array of field mappings between CSV headers and Salesforce fields'),
  metadata: z.object({
    totalCsvHeaders: z.number().describe('Total number of CSV headers provided'),
    successfulMappings: z.number().describe('Number of successful field mappings generated'),
    unmappedHeaders: z.array(z.string()).describe('List of CSV headers that could not be mapped')
  })
});

export type BulkDataLoadMappingType = z.infer<typeof BulkDataLoadMappingSchema>;