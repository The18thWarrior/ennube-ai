import { auth } from "@/auth";
import {Connection, SaveResult, OAuth2, Schema, DescribeGlobalResult, DescribeSObjectResult} from 'jsforce';
import { RefreshTokenResponse, SalesforceAuthResult, SalesforceQueryResult, SalesforceUserInfo } from "./types";
import { IngestJobV2Results, JobInfoV2, QueryJobInfoV2 } from "jsforce/lib/api/bulk2";
import { storeSalesforceCredentials, updateSalesforceCredentials } from "./db/salesforce-storage";




/**
 * Salesforce API client using jsforce for more robust Salesforce API interactions
 */
export class SalesforceClient {
  private readonly connection: Connection;
  private oauth2: OAuth2 | null = null;
  private clientId?: string;
  private clientSecret?: string;
  private refreshToken?: string;
  private userId: string;

  constructor(
    accessToken: string, 
    instanceUrl: string, 
    _userId: string,
    _refreshToken?: string, 
    clientId?: string, 
    clientSecret?: string,
  ) {
    // Initialize jsforce connection with OAuth credentials
    //console.log(accessToken, instanceUrl, _refreshToken, clientId, clientSecret);
    this.clientId = clientId || process.env.SALESFORCE_CLIENT_ID;
    this.clientSecret = clientSecret || process.env.SALESFORCE_CLIENT_SECRET;
    const connectionData = {
      oauth2: new OAuth2({
        clientId: clientId || process.env.SALESFORCE_CLIENT_ID,
        clientSecret: clientSecret || process.env.SALESFORCE_CLIENT_SECRET,
        redirectUri : process.env.SALESFORCE_REDIRECT_URI,
      }),
      loginUrl: instanceUrl.includes('sandbox') ? 'https://test.salesforce.com' : 'https://login.salesforce.com',
      instanceUrl: instanceUrl,
      accessToken: accessToken,
      refreshToken: _refreshToken,
      version: '63.0' // Use the latest API version
    };
    this.connection = new Connection(connectionData);
    if (_refreshToken) this.refreshToken = _refreshToken;

    // Try to get client credentials from parameters or environment variables
    const finalClientId = clientId || process.env.SALESFORCE_CLIENT_ID;
    const finalClientSecret = clientSecret || process.env.SALESFORCE_CLIENT_SECRET;

    // Store OAuth2 credentials for token refresh if available
    if (finalClientId && finalClientSecret && _refreshToken) {
      this.clientId = finalClientId;
      this.clientSecret = finalClientSecret;
      this.oauth2 = new OAuth2({
        clientId: finalClientId,
        clientSecret: finalClientSecret,
        loginUrl: instanceUrl.includes('sandbox') ? 'https://test.salesforce.com' : 'https://login.salesforce.com',
        redirectUri: undefined, // Not needed for refresh token flow
      });
    }

    this.userId = _userId;
  }

  /**
   * Get the underlying jsforce connection
   * This allows direct access to jsforce's full API for advanced use cases
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Refresh the access token using the refresh token
   * @returns The refreshed token information or null if refresh failed
   */
  public async refreshAccessToken(): Promise<RefreshTokenResponse | null> {
    try {
      // If oauth2 is not initialized but we have a refresh token, try to initialize it with env vars
      if (!this.oauth2 && this.refreshToken) {
        const envClientId = process.env.SALESFORCE_CLIENT_ID;
        const envClientSecret = process.env.SALESFORCE_CLIENT_SECRET;
        
        if (envClientId && envClientSecret) {
          this.oauth2 = new OAuth2({
            clientId: envClientId,
            clientSecret: envClientSecret,
            loginUrl: this.connection.instanceUrl.includes('sandbox') ? 'https://test.salesforce.com' : 'https://login.salesforce.com',
          });
        }
      }
      
      if (!this.oauth2 || !this.refreshToken) {
        console.log('Cannot refresh token: Missing OAuth2 configuration or refresh token');
        return null;
      }
      // console.log(this.oauth2, this.connection)
      
      const refreshResult = await this.oauth2.refreshToken(this.refreshToken);
      // Update the connection with the new access token
      const oldAccessToken = this.connection.accessToken as string;
      this.connection.accessToken = refreshResult.access_token;
      const newCredentials : SalesforceAuthResult = {
        success: true,
        userId: this.userId,
        accessToken: refreshResult.access_token,
        instanceUrl: this.connection.instanceUrl,
        refreshToken: refreshResult.refresh_token || this.refreshToken, // Use existing if not provided
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        userInfo: {
          id: this.connection.userInfo?.id,
          organization_id: this.connection.userInfo?.organizationId,
        }
      }
      await updateSalesforceCredentials(newCredentials);

      console.log('Successfully refreshed Salesforce access token');
      return refreshResult;
    } catch (error) {
      console.log('Error refreshing Salesforce access token:', error);
      return null;
    }
  }

  /**
   * Wraps API calls with automatic token refresh on session expiry
   * @param apiCall The API call function to execute
   * @returns The result of the API call
   */
  private async withTokenRefresh<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      // First attempt
      return await apiCall();
    } catch (error) {
      console.log('Error during Salesforce API call:');
      // Check if the error is due to an expired session
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isSessionExpired = errorMsg.includes('INVALID_SESSION_ID') || 
                              errorMsg.includes('Session expired') ||
                              errorMsg.includes('invalid session') ||
                              errorMsg.includes('Bad_OAuth_Token') || 
                              errorMsg.includes('expired access/refresh token') || 
                              errorMsg.includes('expired');
      //('Is session expired:', isSessionExpired,  this.refreshToken);
      if (isSessionExpired && this.refreshToken) {
        const refreshResult = await this.refreshAccessToken();
        if (refreshResult) {
          // Retry the API call with the new token
          return await apiCall();
        } else {
          throw new Error('Unable to refresh Salesforce access token');
        }
      }
      
      // If not a token expiry issue or refresh failed, rethrow the original error
      throw error;
    }
  }

  /**
   * Get current user info from Salesforce
   */
  async getUserInfo(): Promise<SalesforceUserInfo> {
    return this.withTokenRefresh(async () => {
      try {
        // Using jsforce's identity API to get user information
        const userInfo = await this.connection.identity();
        return userInfo as unknown as SalesforceUserInfo;
      } catch (error) {
        console.log('Error fetching Salesforce user info:');
        throw new Error(`Failed to fetch user info: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Query Salesforce data using SOQL
   * Returns standardized response format with records and metadata
   */
  async query<T>(soql: string): Promise<SalesforceQueryResult<T>> {
    return this.withTokenRefresh(async () => {
      try {
        const queryResult = await this.connection.query<any>(soql);
        return {
          totalSize: queryResult.totalSize,
          done: queryResult.done,
          records: queryResult.records,
          nextRecordsUrl: queryResult.nextRecordsUrl
        };
      } catch (error) {
        console.log('Error executing Salesforce SOQL query:', error);
        throw new Error(`SOQL query failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Create a new record in Salesforce
   * @param sobjectType The Salesforce object type (e.g., 'Account', 'Contact')
   * @param data The record data to create
   * @returns The ID of the newly created record
   */
  async create<T>(sobjectType: string, data: Record<string, any>): Promise<string> {
    return this.withTokenRefresh(async () => {
      try {
        const result = await this.connection.sobject(sobjectType).create(data);
        if (!result.success) {
          throw new Error(`Failed to create ${sobjectType}: ${result.errors.join(', ')}`);
        }
        return result.id;
      } catch (error) {
        console.log(`Error creating ${sobjectType}:`, error);
        throw new Error(`Failed to create ${sobjectType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Update an existing record in Salesforce
   * @param sobjectType The Salesforce object type (e.g., 'Account', 'Contact')
   * @param data The record data including Id field
   * @returns True if the update was successful
   */
  async update<T extends { Id: string; [key: string]: any }>(sobjectType: string, data: T): Promise<boolean> {
    return this.withTokenRefresh(async () => {
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
        console.log(`Error updating ${sobjectType}:`, error);
        throw new Error(`Failed to update ${sobjectType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Delete a record from Salesforce
   * @param sobjectType The Salesforce object type (e.g., 'Account', 'Contact')
   * @param id The ID of the record to delete
   * @returns True if the deletion was successful
   */
  async delete(sobjectType: string, id: string): Promise<boolean> {
    return this.withTokenRefresh(async () => {
      try {
        const result = await this.connection.sobject(sobjectType).destroy(id);
        if (!result.success) {
          throw new Error(`Failed to delete ${sobjectType}: ${result.errors.join(', ')}`);
        }
        return true;
      } catch (error) {
        console.log(`Error deleting ${sobjectType}:`, error);
        throw new Error(`Failed to delete ${sobjectType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Retrieve a record by ID
   * @param sobjectType The Salesforce object type (e.g., 'Account', 'Contact')
   * @param id The ID of the record to retrieve
   * @param fields Array of field names to retrieve (optional)
   */
  async retrieve<T>(sobjectType: string, id: string, fields?: string[]): Promise<T> {
    return this.withTokenRefresh(async () => {
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
        console.log(`Error retrieving ${sobjectType}:`, error);
        throw new Error(`Failed to retrieve ${sobjectType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
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
    return this.withTokenRefresh(async () => {
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
          console.log(`Batch ${operation} errors:`, errors);
        }
        
        return results;
      } catch (error) {
        console.log(`Error in batch ${operation}:`, error);
        throw new Error(`Batch ${operation} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Perform a bulk operation using Salesforce Bulk API v2
   * @param type 'ingest' for DML (insert, update, upsert, delete), 'query' for bulk query
   * @param options For 'ingest': { sobjectType, operation, records, externalIdFieldName? } | For 'query': { soql }
   * @returns The created job info
   */
  async bulk(
    type: 'ingest' | 'query',
    options: {
      sobjectType?: string,
      soql?: string,
      operation: 'insert' | 'update' | 'upsert' | 'delete',
      externalIdFieldName?: string,
      records?: Array<{ [key: string]: any }>
    }
  ): Promise<IngestJobV2Results<Schema> | any> {
    return this.withTokenRefresh(async () => {
      const { sobjectType, operation, records, externalIdFieldName, soql } = options;
      if (type === 'ingest' && records && records.length > 0 && sobjectType) {
        //const readStream = Readable.from(records);
        // Use jsforce's loadAndWaitForResults for ingest jobs
        const job = externalIdFieldName ? this.connection.bulk2.createJob({
          operation,
          object: sobjectType,
          externalIdFieldName
        }) : this.connection.bulk2.createJob({
          operation,
          object: sobjectType
        });
        let id = '';
        // the `open` event will be emitted when the job is created.
        job.on('open', (job) => {
          console.log(`Job ${job.id} succesfully created.`)
          id = job.id;
        })

        await job.open()

        // it accepts CSV as a string, an array of records or a Node.js readable stream.
        await job.uploadData(records)

        // uploading data from a CSV as a readable stream:

        // const csvStream = fs.createReadStream(
        //   path.join('Account_bulk2_test.csv'),
        // );
        // await job.uploadData(csvStream)

        await job.close()
        // const jobInfo = await this.connection.bulk2.loadAndWaitForResults({
        //   object: sobjectType,
        //   operation,
        //   externalIdFieldName,
        //   input: records
        // });
        return {id, message: 'job created'};
      } else if (type === 'query' && soql) {
        // Use jsforce's bulk2.query for bulk queries
        const jobInfo = (await this.connection.bulk2.query(soql)).toArray();
        return jobInfo;
      } else {
        throw new Error('Invalid bulk operation type');
      }
    });
  }


  async bulkStatus(type: 'query' | 'ingest', batchId: string): Promise<JobInfoV2 | QueryJobInfoV2> {
    return this.withTokenRefresh(async () => {
      try {
        if (type === 'ingest') {
          const result = await this.connection.bulk2.job('ingest', {id: batchId}).check();
          return result;
        } else {
          const result = await this.connection.bulk2.job('query', {id: batchId}).check();
          return result;
        }
      } catch (error) {
        console.log(`Error checking batch status for ID ${batchId}:`, error);
        throw new Error(`Failed to check batch status: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Describe a Salesforce object (get metadata)
   * @param sobjectType The API name of the Salesforce object
   */
  async describe(sobjectType: string): Promise<DescribeSObjectResult> {
    return this.withTokenRefresh(async () => {
      try {
        const result = await this.connection.sobject(sobjectType).describe();
        return result;
      } catch (error) {
        console.log(`Error describing ${sobjectType}:`, error);
        throw new Error(`Failed to describe ${sobjectType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Get a list of all available objects in the org
   */
  async describeGlobal(): Promise<DescribeGlobalResult> {
    return this.withTokenRefresh(async () => {
      try {
        const result = await this.connection.describeGlobal();
        return result;
      } catch (error) {
        console.log('Error retrieving global object descriptions:', error);
        throw new Error(`Failed to retrieve object list: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Perform a raw GET request to a Salesforce REST API endpoint
   * @param url The relative or absolute Salesforce REST API URL
   * @returns The result of the GET request
   */
  async getByUrl<T = any>(url: string): Promise<T> {
    return this.withTokenRefresh(async () => {
      try {
        return await this.connection.requestGet(url);
      } catch (error) {
        console.log(`Error performing GET request to ${url}:`, error);
        throw new Error(`Failed to GET from Salesforce: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }


  async streamContentVersion(
    contentVersionId: string
  ): Promise<NodeJS.ReadableStream> {
    return this.withTokenRefresh(async () => {
      try {
        return this.connection.sobject('ContentVersion').record(contentVersionId).blob('VersionData');
      } catch (error) {
        console.log(`Error streaming content version ${contentVersionId}:`, error);
        throw new Error(`Failed to stream content version: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Check if a managed package is installed in the org
   * @param namespacePrefix The namespace prefix of the managed package
   * @returns The InstalledSubscriberPackage record if installed, otherwise null
   *
   * Usage:
   *   const pkg = await client.isPackageInstalled('my_ns');
   *   if (pkg) { ... }
   */
  async isPackageInstalled(namespacePrefix: string): Promise<{installed: boolean, validVersion: boolean} | null> {
    return this.withTokenRefresh(async () => {
      try {
        // Query the Tooling API for InstalledSubscriberPackage by NamespacePrefix
        const soql = `SELECT Id, SubscriberPackageId, SubscriberPackage.NamespacePrefix, SubscriberPackage.Name, SubscriberPackageVersionId FROM InstalledSubscriberPackage`;
        const result = await this.connection.tooling.query<any>(soql);
        if (result.records && result.records.length > 0) {
          const _package = result.records.find((packageRecord: any) => {
            if (packageRecord.SubscriberPackage.NamespacePrefix === namespacePrefix) {
              return true;
            }
          });
          if (_package) {
            console.log(`Package ${namespacePrefix} is installed with version:`, _package.SubscriberPackageVersionId);
            return {
              installed: true,
              validVersion: _package.SubscriberPackageVersionId === process.env.NEXT_PUBLIC_SFDC_MANAGED_PACKAGE_VERSION
            };
          }
        }
        return { installed: false, validVersion: false };
      } catch (error) {
        console.log(`Error checking package installation for namespace '${namespacePrefix}':`, error);
        //throw new Error(`Failed to check package installation: ${error instanceof Error ? error.message : String(error)}`);
        return { installed: false, validVersion: false };
      }
    });
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
  userId: string,
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
      userId,
      accessToken: conn.accessToken as string,
      instanceUrl: conn.instanceUrl as string,
      refreshToken: conn.refreshToken as string,
      userInfo: {
        id: userInfo.id,
        organization_id: userInfo.organization_id,
        display_name: userInfo.display_name,
        email: userInfo.email,
      }
    };
  } catch (error) {
    console.log('Salesforce authentication error:', error);
    return {
      success: false,
      userId,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Generate Salesforce OAuth2 authorization URL
 * @param clientId Salesforce OAuth2 client ID (optional, will use env var if not provided)
 * @param clientSecret Salesforce OAuth2 client secret (optional, will use env var if not provided)
 * @param redirectUri Callback URI for Salesforce OAuth2 (optional, will use env var if not provided)
 * @param loginUrl Optional login URL (default: https://login.salesforce.com)
 * @returns Authorization URL
 */
export function getAuthorizationUrl(
  clientId?: string,
  clientSecret?: string,
  redirectUri?: string,
  loginUrl: string = 'https://login.salesforce.com'
): string {
  // Use provided credentials or fall back to environment variables
  const finalClientId = clientId || process.env.SALESFORCE_CLIENT_ID;
  const finalClientSecret = clientSecret || process.env.SALESFORCE_CLIENT_SECRET;
  const finalRedirectUri = redirectUri || process.env.SALESFORCE_REDIRECT_URI;
  
  if (!finalClientId || !finalClientSecret || !finalRedirectUri) {
    throw new Error('Missing Salesforce OAuth credentials. Provide parameters or set environment variables.');
  }

  const oauth2 = new OAuth2({
    clientId: finalClientId,
    clientSecret: finalClientSecret,
    redirectUri: finalRedirectUri,
    loginUrl
  });

  return oauth2.getAuthorizationUrl({
    scope: 'api id refresh_token'
  });
}

/**
 * Handle Salesforce OAuth2 callback and exchange authorization code for access token
 * @param code Authorization code received from Salesforce
 * @param clientId Salesforce OAuth2 client ID (optional, will use env var if not provided)
 * @param clientSecret Salesforce OAuth2 client secret (optional, will use env var if not provided)
 * @param redirectUri Callback URI for Salesforce OAuth2
 * @param loginUrl Optional login URL (default: https://login.salesforce.com)
 * @returns Authentication result with access token and instance URL
 */
export async function handleOAuthCallback(
  code: string,
  clientId?: string,
  clientSecret?: string,
  redirectUri?: string,
  loginUrl: string = 'https://login.salesforce.com'
): Promise<SalesforceAuthResult> {
  const session = await auth();
  const userId = session?.user.sub;
  if (!userId) {
    return {
      success: false,
      userId: '',
      error: 'No user ID found in session'
    }
  }
  try {
    // Use provided credentials or fall back to environment variables
    const finalClientId = clientId || process.env.SALESFORCE_CLIENT_ID;
    const finalClientSecret = clientSecret || process.env.SALESFORCE_CLIENT_SECRET;
    const finalRedirectUri = redirectUri || process.env.SALESFORCE_REDIRECT_URI;
    
    if (!finalClientId || !finalClientSecret || !finalRedirectUri) {
      throw new Error('Missing Salesforce OAuth credentials. Provide parameters or set environment variables.');
    }
    const oauth2Data = {
      clientId: finalClientId,
      clientSecret: finalClientSecret,
      redirectUri: finalRedirectUri,
      loginUrl: loginUrl || 'https://login.salesforce.com'
    };
    //console.log('OAuth2 Data:', oauth2Data);
    const oauth2 = new OAuth2(oauth2Data);

    const conn = new Connection({ oauth2 });
    const userInfo = await conn.authorize(code);
    //console.log('User Info:', userInfo, conn.refreshToken, conn.accessToken);
    return {
      success: true,
      userId,
      accessToken: conn.accessToken as string,
      refreshToken: conn.refreshToken as string,
      instanceUrl: conn.instanceUrl as string,
      clientId: finalClientId,
      clientSecret: finalClientSecret,
      userInfo: {
        id: userInfo.id,
        organization_id: userInfo.organizationId, // Corrected property name
      }
    };
  } catch (error) {
    console.log('Error handling OAuth callback:', error);
    return {
      success: false,
      userId: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Create a Salesforce client from authentication result
 * This is the recommended way to create a client as it properly sets up token refresh
 * @param authResult The authentication result from handleOAuthCallback or connectToSalesforce
 * @returns SalesforceClient instance
 */
export function createSalesforceClient(authResult: SalesforceAuthResult): SalesforceClient {
  if (!authResult.success || !authResult.accessToken || !authResult.instanceUrl) {
    throw new Error('Cannot create Salesforce client: Invalid authentication result');
  }
  
  // Client will automatically use environment variables if these are not provided
  return new SalesforceClient(
    authResult.accessToken,
    authResult.instanceUrl,
    authResult.userId,
    authResult.refreshToken,
    authResult.clientId,
    authResult.clientSecret
  );
}

