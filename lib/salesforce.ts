import { auth } from "@/auth";
import { Session } from "next-auth";
import {Connection, SaveResult, OAuth2} from 'jsforce';

export interface SalesforceAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
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

/**
 * Salesforce API client using jsforce for more robust Salesforce API interactions
 */
export class SalesforceClient {
  private readonly connection: Connection;

  constructor(accessToken: string, instanceUrl: string) {
    // Initialize jsforce connection with OAuth credentials
    this.connection = new Connection({
      instanceUrl: instanceUrl,
      accessToken: accessToken
    });
  }

  /**
   * Get the underlying jsforce connection
   * This allows direct access to jsforce's full API for advanced use cases
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get current user info from Salesforce
   */
  async getUserInfo(): Promise<SalesforceUserInfo> {
    try {
      // Using jsforce's identity API to get user information
      const userInfo = await this.connection.identity();
      return userInfo as unknown as SalesforceUserInfo;
    } catch (error) {
      console.error('Error fetching Salesforce user info:', error);
      throw new Error(`Failed to fetch user info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Query Salesforce data using SOQL
   * Returns standardized response format with records and metadata
   */
  async query<T>(soql: string): Promise<SalesforceQueryResult<T>> {
    try {
      const queryResult = await this.connection.query<any>(soql);
      return {
        totalSize: queryResult.totalSize,
        done: queryResult.done,
        records: queryResult.records,
        nextRecordsUrl: queryResult.nextRecordsUrl
      };
    } catch (error) {
      console.error('Error executing Salesforce SOQL query:', error);
      throw new Error(`SOQL query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create a new record in Salesforce
   * @param sobjectType The Salesforce object type (e.g., 'Account', 'Contact')
   * @param data The record data to create
   * @returns The ID of the newly created record
   */
  async create<T>(sobjectType: string, data: Record<string, any>): Promise<string> {
    try {
      const result = await this.connection.sobject(sobjectType).create(data);
      if (!result.success) {
        throw new Error(`Failed to create ${sobjectType}: ${result.errors.join(', ')}`);
      }
      return result.id;
    } catch (error) {
      console.error(`Error creating ${sobjectType}:`, error);
      throw new Error(`Failed to create ${sobjectType}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update an existing record in Salesforce
   * @param sobjectType The Salesforce object type (e.g., 'Account', 'Contact')
   * @param data The record data including Id field
   * @returns True if the update was successful
   */
  async update<T extends { Id: string; [key: string]: any }>(sobjectType: string, data: T): Promise<boolean> {
    try {
      if (!data.Id) {
        throw new Error('Record ID is required for update operations');
      }
      
      const result = await this.connection.sobject(sobjectType).update(data);
      if (!result.success) {
        throw new Error(`Failed to update ${sobjectType}: ${result.errors.join(', ')}`);
      }
      return true;
    } catch (error) {
      console.error(`Error updating ${sobjectType}:`, error);
      throw new Error(`Failed to update ${sobjectType}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete a record from Salesforce
   * @param sobjectType The Salesforce object type (e.g., 'Account', 'Contact')
   * @param id The ID of the record to delete
   * @returns True if the deletion was successful
   */
  async delete(sobjectType: string, id: string): Promise<boolean> {
    try {
      const result = await this.connection.sobject(sobjectType).destroy(id);
      if (!result.success) {
        throw new Error(`Failed to delete ${sobjectType}: ${result.errors.join(', ')}`);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting ${sobjectType}:`, error);
      throw new Error(`Failed to delete ${sobjectType}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Retrieve a record by ID
   * @param sobjectType The Salesforce object type (e.g., 'Account', 'Contact')
   * @param id The ID of the record to retrieve
   * @param fields Array of field names to retrieve (optional)
   */
  async retrieve<T>(sobjectType: string, id: string, fields?: string[]): Promise<T> {
    try {
      if (fields && fields.length > 0) {
        // If specific fields are requested
        const fieldList = fields.join(', ');
        const soql = `SELECT ${fieldList} FROM ${sobjectType} WHERE Id = '${id}'`;
        const result = await this.query<T>(soql);
        
        if (result.records.length === 0) {
          throw new Error(`No ${sobjectType} found with ID: ${id}`);
        }
        
        return result.records[0];
      } else {
        // Retrieve all fields
        return await this.connection.sobject(sobjectType).retrieve(id) as T;
      }
    } catch (error) {
      console.error(`Error retrieving ${sobjectType}:`, error);
      throw new Error(`Failed to retrieve ${sobjectType}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Execute a batch operation (create, update, or delete multiple records)
   * @param operation The operation type ('create', 'update', 'delete')
   * @param sobjectType The Salesforce object type
   * @param records Array of records to process
   */
  async batch(
    operation: 'create' | 'update' | 'delete', 
    sobjectType: string, 
    records: Array<{ Id?: string } & Record<string, any>>
  ): Promise<Array<SaveResult>> {
    try {
      let results: Array<SaveResult>;
      
      switch (operation) {
        case 'create':
          results = await this.connection.sobject(sobjectType).create(records);
          break;
        case 'update':
          results = await this.connection.sobject(sobjectType).update(records as Array<{ Id: string, [key: string]: any }>);
          break;
        case 'delete':
          // For delete, we need just an array of IDs
          const ids = records.map(record => record.Id || record.id);
          results = await this.connection.sobject(sobjectType).destroy(ids);
          break;
        default:
          throw new Error(`Unsupported batch operation: ${operation}`);
      }
      
      // Check for any errors in the batch results
      const errors = results.filter(r => !r.success)
        .map(r => `ID: ${r.id}, Errors: ${r.errors.join(', ')}`);
      
      if (errors.length > 0) {
        console.error(`Batch ${operation} errors:`, errors);
      }
      
      return results;
    } catch (error) {
      console.error(`Error in batch ${operation}:`, error);
      throw new Error(`Batch ${operation} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Describe a Salesforce object (get metadata)
   * @param sobjectType The API name of the Salesforce object
   */
  async describe(sobjectType: string): Promise<any> {
    try {
      const result = await this.connection.sobject(sobjectType).describe();
      return result;
    } catch (error) {
      console.error(`Error describing ${sobjectType}:`, error);
      throw new Error(`Failed to describe ${sobjectType}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a list of all available objects in the org
   */
  async describeGlobal(): Promise<any> {
    try {
      const result = await this.connection.describeGlobal();
      return result;
    } catch (error) {
      console.error('Error retrieving global object descriptions:', error);
      throw new Error(`Failed to retrieve object list: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Direct authentication with Salesforce using JSForce
 * @param username Salesforce username
 * @param password Salesforce password
 * @param securityToken Salesforce security token
 * @param loginUrl Optional login URL (default: https://login.salesforce.com)
 * @returns Authentication result with access token and instance URL
 */
export async function connectToSalesforce(
  username: string,
  password: string,
  securityToken: string = '',
  loginUrl: string = 'https://login.salesforce.com'
): Promise<SalesforceAuthResult> {
  try {
    // Create a new connection for authentication
    const conn = new Connection({ loginUrl });
    
    // Authenticate with username and password
    const userPassword = securityToken ? `${password}${securityToken}` : password;
    await conn.login(username, userPassword);
    
    // Get user info for additional data
    const userInfo = await conn.identity() as unknown as SalesforceUserInfo;
    
    return {
      success: true,
      accessToken: conn.accessToken as string,
      instanceUrl: conn.instanceUrl as string,
      userInfo: {
        id: userInfo.id,
        organization_id: userInfo.organization_id,
        display_name: userInfo.display_name,
        email: userInfo.email,
      }
    };
  } catch (error) {
    console.error('Salesforce authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Generate Salesforce OAuth2 authorization URL
 * @param clientId Salesforce OAuth2 client ID
 * @param redirectUri Callback URI for Salesforce OAuth2
 * @param loginUrl Optional login URL (default: https://login.salesforce.com)
 * @returns Authorization URL
 */
export function getAuthorizationUrl(
  clientId: string,
  secret: string,
  redirectUri: string,
  loginUrl: string = 'https://login.salesforce.com'
): string {
  const oauth2 = new OAuth2({
    clientId,
    clientSecret: secret,
    redirectUri,
    loginUrl
  });

  return oauth2.getAuthorizationUrl({
    scope: 'api id refresh_token'
  });
}

/**
 * Handle Salesforce OAuth2 callback and exchange authorization code for access token
 * @param code Authorization code received from Salesforce
 * @param clientId Salesforce OAuth2 client ID
 * @param clientSecret Salesforce OAuth2 client secret
 * @param redirectUri Callback URI for Salesforce OAuth2
 * @param loginUrl Optional login URL (default: https://login.salesforce.com)
 * @returns Authentication result with access token and instance URL
 */
export async function handleOAuthCallback(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  loginUrl: string = 'https://login.salesforce.com'
): Promise<SalesforceAuthResult> {
  try {
    const oauth2 = new OAuth2({
      clientId,
      clientSecret,
      redirectUri,
      //loginUrl
    });

    const conn = new Connection({ oauth2 });
    const userInfo = await conn.authorize(code);
    return {
      success: true,
      accessToken: conn.accessToken as string,
      refreshToken: conn.refreshToken as string,
      instanceUrl: conn.instanceUrl as string,
      userInfo: {
        id: userInfo.id,
        organization_id: userInfo.organizationId, // Corrected property name
      }
    };
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
