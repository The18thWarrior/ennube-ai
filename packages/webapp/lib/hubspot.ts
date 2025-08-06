import { auth } from "@/auth";
import { Session } from "next-auth";
import { Client } from '@hubspot/api-client';
import { HubSpotRefreshTokenResponse, RefreshTokenResponse, HubSpotUserInfo, HubSpotQueryResult, HubSpotAuthResult } from "./types";
import { StoredHubSpotCredentials, storeHubSpotCredentials, updateHubSpotCredentials } from "./db/hubspot-storage";

export const hubspotFields = {
  companies: [
    "createdate",
    "hs_object_id",
    "name",
    "domain",
    "description",
    "industry",
    "numberofemployees",
    "annualrevenue",
    "phone",
    "website",
    "address",
    "city",
    "state",
    "zip",
    "country",
    "hs_lastmodifieddate",
    "hs_lastmodifiedby",
    "facebook_company_page",
    "googleplus_page",
    "hs_lastactivitydate",
    "hs_lastcontacted",
    "hs_csm_sentiment",
    "hs_ideal_customer_profile",
    "hs_is_enriched",
    "hs_logo_url",
    "linkedin_company_page",
    "twitterhandle"
  ]
}

/**
 * HubSpot API client using @hubspot/api-client for HubSpot API interactions
 */
export class HubSpotClient {
  private readonly client: Client;
  private refreshToken?: string;
  private clientId?: string;
  private clientSecret?: string;
  private accessToken?: string;
  private expiresAt?: number; // Timestamp when the token expires
  private credential?: StoredHubSpotCredentials;

  constructor(
    accessToken: string,
    refreshToken?: string,
    clientId?: string,
    clientSecret?: string,
    expiresIn?: number,
    credential?: StoredHubSpotCredentials
  ) {
    // Initialize HubSpot client with OAuth credentials
    this.client = new Client({
      accessToken: accessToken,
    });

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    // Try to get client credentials from parameters or environment variables
    this.clientId = clientId || process.env.HUBSPOT_CLIENT_ID;
    this.clientSecret = clientSecret || process.env.HUBSPOT_CLIENT_SECRET;

    // Set token expiration time if provided
    if (expiresIn) {
      this.expiresAt = Date.now() + expiresIn * 1000;
    }

    if (credential) {
      this.credential = credential;
    }
  }

  /**
   * Get the underlying HubSpot client
   * This allows direct access to the client's full API for advanced use cases
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Refresh the access token using the refresh token
   * @returns The refreshed token information or null if refresh failed
   */
  private async refreshAccessToken(): Promise<HubSpotRefreshTokenResponse | null> {
    try {
      if (!this.refreshToken || !this.clientId || !this.clientSecret) {
        console.warn('Cannot refresh token: Missing OAuth2 configuration or refresh token');
        return null;
      }

      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to refresh token: ${errorData.message || response.statusText}`);
      }

      const refreshResult = await response.json() as HubSpotRefreshTokenResponse;
      
      // Update client with new token
      this.accessToken = refreshResult.access_token;
      this.client.setAccessToken(refreshResult.access_token);
      
      // Update refresh token if a new one is provided
      if (refreshResult.refresh_token) {
        this.refreshToken = refreshResult.refresh_token;
      }
      
      // Update expiration time
      this.expiresAt = Date.now() + refreshResult.expires_in * 1000;
      
      await updateHubSpotCredentials(
        this.credential?.userId || '',
        this.accessToken,
        this.refreshToken,
        refreshResult.expires_in
      )
      console.log('Successfully refreshed HubSpot access token');
      return refreshResult;
    } catch (error) {
      console.log('Error refreshing HubSpot access token:', error);
      return null;
    }
  }

  /**
   * Checks if the current token is expired and needs refreshing
   */
  private isTokenExpired(): boolean {
    if (!this.expiresAt) return false; // If we don't know when it expires, assume it's still valid
    
    // Add a 60-second buffer to account for latency
    return Date.now() > (this.expiresAt - 60000);
  }

  /**
   * Wraps API calls with automatic token refresh on expiry
   * @param apiCall The API call function to execute
   * @returns The result of the API call
   */
  private async withTokenRefresh<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      // Check if token needs refresh before making call
      if (this.refreshToken && this.isTokenExpired()) {
        console.log('HubSpot token expired. Refreshing token...');
        const refreshResult = await this.refreshAccessToken();
        
        if (!refreshResult) {
          throw new Error('Unable to refresh HubSpot access token');
        }
      }

      // First attempt
      return await apiCall();
    } catch (error) {
      console.log('Error during HubSpot API call:');
      // Check if the error is due to an expired or invalid token
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isTokenError = 
        errorMsg.includes('expired') ||
        errorMsg.includes('invalid_token') ||
        errorMsg.includes('401') ||
        errorMsg.includes('unauthorized') || 
        errorMsg.includes('Not Found');
      
      if (isTokenError && this.refreshToken) {
        console.log('HubSpot token appears to be invalid. Attempting to refresh...');
        const refreshResult = await this.refreshAccessToken();
        
        if (refreshResult) {
          // Retry the API call with the new token
          return await apiCall();
        } else {
          throw new Error('Unable to refresh HubSpot access token');
        }
      }
      
      // If not a token issue or refresh failed, rethrow the original error
      throw error;
    }
  }

  /**
   * Get current user info from HubSpot
   */
  async getUserInfo(): Promise<HubSpotUserInfo> {
    return this.withTokenRefresh(async () => {
      try {
        // HubSpot doesn't have a direct identity API like Salesforce
        // Using the oauth info endpoint instead
        const response = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + this.accessToken, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user info: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
          id: data.user_id,
          email: data.user,
          portalId: data.hub_id
        };
      } catch (error) {
        console.log('Error fetching HubSpot user info:');
        throw new Error(`Failed to fetch user info: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Search for records in HubSpot
   * @param objectType HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param query The search query and parameters
   * @returns Standardized query result
   */
  async query<T>(objectType: string, query: any = {}): Promise<HubSpotQueryResult<T>> {
    return this.withTokenRefresh(async () => {
      try {
        let result;
        // Map common object types
        switch (objectType.toLowerCase()) {
          case 'contacts':
            result = await this.client.crm.contacts.searchApi.doSearch(query);
            break;
          case 'companies':
            result = await this.client.crm.companies.searchApi.doSearch(query);
            break;
          case 'deals':
            result = await this.client.crm.deals.searchApi.doSearch(query);
            break;
          case 'tickets':
            result = await this.client.crm.tickets.searchApi.doSearch(query);
            break;
          default:
            // Generic object search for custom objects
            result = await this.client.crm.objects.searchApi.doSearch(objectType, query);
        }
        
        // Standardize response format to match the SalesforceQueryResult interface
        
        return {
          totalSize: result.total || 0,
          done: !result.paging?.next,
          records: result.results as T[],
          nextPageToken: result.paging?.next?.after
        };
      } catch (error) {
        console.log('Error executing HubSpot query:');
        throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Create a new record in HubSpot
   * @param objectType The HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param data The record data to create
   * @returns The ID of the newly created record
   */
  async create<T>(objectType: string, data: Record<string, any>): Promise<string> {
    return this.withTokenRefresh(async () => {
      try {
        let result;
        
        // Map to appropriate object API
        switch (objectType.toLowerCase()) {
          case 'contacts':
            result = await this.client.crm.contacts.basicApi.create({ properties: data });
            break;
          case 'companies':
            result = await this.client.crm.companies.basicApi.create({ properties: data });
            break;
          case 'deals':
            result = await this.client.crm.deals.basicApi.create({ properties: data });
            break;
          case 'tickets':
            result = await this.client.crm.tickets.basicApi.create({ properties: data });
            break;
          default:
            // For custom objects
            result = await this.client.crm.objects.basicApi.create(objectType, { properties: data });
        }
        
        return result.id;
      } catch (error) {
        console.log(`Error creating ${objectType}:`, error);
        throw new Error(`Failed to create ${objectType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Update an existing record in HubSpot
   * @param objectType The HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param id The ID of the record to update
   * @param data The record data to update
   * @returns True if the update was successful
   */
  async update<T>(objectType: string, id: string, data: Record<string, any>): Promise<boolean> {
    return this.withTokenRefresh(async () => {
      try {
        if (!id) {
          throw new Error('Record ID is required for update operations');
        }
        
        let result;
        
        // Map to appropriate object API
        switch (objectType.toLowerCase()) {
          case 'contacts':
            result = await this.client.crm.contacts.basicApi.update(id, { properties: data });
            break;
          case 'companies':
            result = await this.client.crm.companies.basicApi.update(id, { properties: data });
            break;
          case 'deals':
            result = await this.client.crm.deals.basicApi.update(id, { properties: data });
            break;
          case 'tickets':
            result = await this.client.crm.tickets.basicApi.update(id, { properties: data });
            break;
          default:
            // For custom objects
            result = await this.client.crm.objects.basicApi.update(objectType, id, { properties: data });
        }
        
        return true;
      } catch (error) {
        console.log(`Error updating ${objectType}:`);
        throw new Error(`Failed to update ${objectType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Delete a record from HubSpot
   * @param objectType The HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param id The ID of the record to delete
   * @returns True if the deletion was successful
   */
  async delete(objectType: string, id: string): Promise<boolean> {
    return this.withTokenRefresh(async () => {
      try {
        if (!id) {
          throw new Error('Record ID is required for delete operations');
        }
        
        // Map to appropriate object API
        switch (objectType.toLowerCase()) {
          case 'contacts':
            await this.client.crm.contacts.basicApi.archive(id);
            break;
          case 'companies':
            await this.client.crm.companies.basicApi.archive(id);
            break;
          case 'deals':
            await this.client.crm.deals.basicApi.archive(id);
            break;
          case 'tickets':
            await this.client.crm.tickets.basicApi.archive(id);
            break;
          default:
            // For custom objects
            await this.client.crm.objects.basicApi.archive(objectType, id);
        }
        
        return true;
      } catch (error) {
        console.log(`Error deleting ${objectType}:`, error);
        throw new Error(`Failed to delete ${objectType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Create a note in HubSpot and associate it with a record
   * @param content The content of the note
   * @param associatedObjectType The type of object to associate with (e.g., 'contacts', 'companies', 'deals')
   * @param associatedObjectId The ID of the object to associate with
   * @returns The ID of the newly created note
   */
  async createNotes(content: string, associatedObjectType: string, associatedObjectId: string): Promise<string> {
    return this.withTokenRefresh(async () => {
      try {
        // Validate required parameters
        if (!content) {
          throw new Error('Note content is required');
        }
        
        if (!associatedObjectId) {
          throw new Error('Associated object ID is required');
        }

        // Create the note first
        const noteData = {
          properties: {
            hs_note_body: content,
          }
        };
        
        // Create the note using HubSpot API
        const result = await this.client.crm.objects.notes.basicApi.create(noteData);
        
        // Then create the association using the raw HTTP API since the client's association methods
        // might have type incompatibilities
        if (result.id) {
          const associationUrl = `https://api.hubapi.com/crm/v4/objects/notes/${result.id}/associations/${associatedObjectType}/${associatedObjectId}`;
          
          const response = await fetch(associationUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.warn(`Warning: Failed to create association for note ${result.id}: ${response.statusText}`);
          }
        }
        
        return result.id;
      } catch (error) {
        console.log('Error creating note in HubSpot:', error);
        throw new Error(`Failed to create note: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Add multiple notes to a HubSpot record
   * @param objectType The HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param objectId The ID of the record to associate the notes with
   * @param notes Array of note contents to create
   * @returns Array of created note IDs
   */
  async addNotes(objectType: string, objectId: string, notes: string[]): Promise<string[]> {
    return this.withTokenRefresh(async () => {
      try {
        if (!notes || notes.length === 0) {
          return [];
        }
        
        const noteIds: string[] = [];
        
        // Create each note sequentially
        for (const noteContent of notes) {
          if (noteContent && noteContent.trim()) {
            try {
              const noteId = await this.createNotes(noteContent, objectType, objectId);
              noteIds.push(noteId);
            } catch (noteError) {
              console.warn(`Warning: Failed to create note: ${noteError instanceof Error ? noteError.message : String(noteError)}`);
            }
          }
        }
        
        return noteIds;
      } catch (error) {
        console.log('Error adding notes:', error);
        throw new Error(`Failed to add notes: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Retrieve a record by ID
   * @param objectType The HubSpot object type (e.g., 'contacts', 'companies', 'deals')
   * @param id The ID of the record to retrieve
   * @param properties Array of property names to retrieve (optional)
   */
  async retrieve<T>(objectType: string, id: string, properties?: string[]): Promise<T> {
    return this.withTokenRefresh(async () => {
      try {
        let result;
        
        // Map to appropriate object API
        switch (objectType.toLowerCase()) {
          case 'contacts':
            result = await this.client.crm.contacts.basicApi.getById(id, properties);
            break;
          case 'companies':
            result = await this.client.crm.companies.basicApi.getById(id, properties);
            break;
          case 'deals':
            result = await this.client.crm.deals.basicApi.getById(id, properties);
            break;
          case 'tickets':
            result = await this.client.crm.tickets.basicApi.getById(id, properties);
            break;
          default:
            // For custom objects
            result = await this.client.crm.objects.basicApi.getById(objectType, id, properties);
        }
        
        // Convert to standardized format
        const record = {
          id: result.id,
          ...result.properties
        } as unknown as T;
        
        return record;
      } catch (error) {
        console.log(`Error retrieving ${objectType}:`, error);
        throw new Error(`Failed to retrieve ${objectType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Execute a batch operation (create, update, or delete multiple records)
   * @param operation The operation type ('create', 'update', 'delete')
   * @param objectType The HubSpot object type
   * @param records Array of records to process
   */
  async batch(
    operation: 'create' | 'update' | 'delete', 
    objectType: string, 
    records: Array<{ id?: string } & Record<string, any>>
  ): Promise<Array<{ id: string; success: boolean; error?: string }>> {
    return this.withTokenRefresh(async () => {
      try {
        const objType = objectType.toLowerCase();
        const results: Array<{ id: string; success: boolean; error?: string }> = [];
        
        // Process records individually instead of in batch to avoid type issues
        // This is less efficient but more reliable from a typing perspective
        switch (operation) {
          case 'create': {
            for (const record of records) {
              try {
                const id = await this.create(objType, record);
                results.push({ id, success: true });
              } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                results.push({ 
                  id: record.id || 'unknown', 
                  success: false,
                  error: errorMsg 
                });
              }
            }
            break;
          }
            
          case 'update': {
            for (const record of records) {
              if (!record.id) {
                results.push({ 
                  id: 'unknown', 
                  success: false,
                  error: 'Record ID is required for update operations' 
                });
                continue;
              }
              
              try {
                // Make a copy to avoid modifying the original
                const props = { ...record };
                // The ID should not be in the properties
                if ('id' in props) {
                  delete props.id;
                }
                
                await this.update(objType, record.id, props);
                results.push({ id: record.id, success: true });
              } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                results.push({ 
                  id: record.id, 
                  success: false,
                  error: errorMsg 
                });
              }
            }
            break;
          }
            
          case 'delete': {
            for (const record of records) {
              if (!record.id) {
                results.push({ 
                  id: 'unknown', 
                  success: false,
                  error: 'Record ID is required for delete operations' 
                });
                continue;
              }
              
              try {
                await this.delete(objType, record.id);
                results.push({ id: record.id, success: true });
              } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                results.push({ 
                  id: record.id, 
                  success: false,
                  error: errorMsg 
                });
              }
            }
            break;
          }
          
          default:
            throw new Error(`Unsupported batch operation: ${operation}`);
        }
        
        return results;
      } catch (error) {
        console.log(`Error in batch ${operation}:`, error);
        throw new Error(`Batch ${operation} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Describe a HubSpot object schema (get metadata)
   * @param objectType The HubSpot object type
   */
  async describe(objectType: string): Promise<any> {
    return this.withTokenRefresh(async () => {
      try {
        // Get schema for the specified object type
        const result = await this.client.crm.schemas.coreApi.getById(objectType);
        return result;
      } catch (error) {
        console.log(`Error describing ${objectType}:`, error);
        throw new Error(`Failed to describe ${objectType}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Get a list of all available objects in the HubSpot account
   */
  async describeGlobal(): Promise<any> {
    return this.withTokenRefresh(async () => {
      try {
        // Get all object schemas
        const result = await this.client.crm.schemas.coreApi.getAll();
        return result;
      } catch (error) {
        console.log('Error retrieving global object descriptions:', error);
        throw new Error(`Failed to retrieve object list: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Direct authentication with HubSpot using API key
 * @param apiKey HubSpot API key
 * @returns Authentication result with access token
 */
export async function connectToHubSpotWithApiKey(
  apiKey: string
): Promise<HubSpotAuthResult> {
  try {
    // Create a new client with the API key
    const client = new Client({ apiKey });
    
    // Test the connection by making a simple API call
    await client.crm.contacts.basicApi.getPage();
    
    return {
      success: true,
      accessToken: apiKey,
      credential: null
    };
  } catch (error) {
    console.log('HubSpot authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      credential: null
    };
  }
}

/**
 * Generate HubSpot OAuth2 authorization URL
 * @param clientId HubSpot OAuth2 client ID (optional, will use env var if not provided)
 * @param redirectUri Callback URI for HubSpot OAuth2 (optional, will use env var if not provided)
 * @param scopes Array of scope strings to request (optional)
 * @returns Authorization URL
 */
export function getAuthorizationUrl(
  clientId?: string,
  redirectUri?: string,
  scopes: string[] = []
): string {
  // Use provided credentials or fall back to environment variables
  const finalClientId = clientId || process.env.HUBSPOT_CLIENT_ID;
  const finalRedirectUri = redirectUri || process.env.HUBSPOT_REDIRECT_URI;
  
  if (!finalClientId || !finalRedirectUri) {
    throw new Error('Missing HubSpot OAuth credentials. Provide parameters or set environment variables.');
  }

  // Join scopes with a space
  const scope = encodeURIComponent(scopes.join(' '));
  
  // Generate the authorization URL
  return `https://app.hubspot.com/oauth/authorize?client_id=${finalClientId}&redirect_uri=${encodeURIComponent(finalRedirectUri)}&scope=${scope}`;
}

/**
 * Handle HubSpot OAuth2 callback and exchange authorization code for access token
 * @param code Authorization code received from HubSpot
 * @param clientId HubSpot OAuth2 client ID (optional, will use env var if not provided)
 * @param clientSecret HubSpot OAuth2 client secret (optional, will use env var if not provided)
 * @param redirectUri Callback URI for HubSpot OAuth2
 * @returns Authentication result with access token and refresh token
 */
export async function handleOAuthCallback(
  code: string,
  clientId?: string,
  clientSecret?: string,
  redirectUri?: string,
): Promise<HubSpotAuthResult> {
  try {
    // Use provided credentials or fall back to environment variables
    const finalClientId = clientId || process.env.HUBSPOT_CLIENT_ID;
    const finalClientSecret = clientSecret || process.env.HUBSPOT_CLIENT_SECRET;
    const finalRedirectUri = redirectUri || process.env.HUBSPOT_REDIRECT_URI;
    
    if (!finalClientId || !finalClientSecret || !finalRedirectUri) {
      throw new Error('Missing HubSpot OAuth credentials. Provide parameters or set environment variables.');
    }

    // Exchange the authorization code for an access token
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: finalClientId,
        client_secret: finalClientSecret,
        redirect_uri: finalRedirectUri,
        code: code
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to exchange code for token: ${errorData.message || response.statusText}`);
    }

    const tokenData = await response.json();
    
    // Create a client to get user info
    const client = new Client({
      accessToken: tokenData.access_token
    });

    // Try to get user information
    let userInfo = {};
    try {
      const userResponse = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + tokenData.access_token, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userInfo = {
          id: userData.user_id,
          email: userData.user,
          portalId: userData.hub_id
        };
      }
    } catch (userError) {
      console.warn('Could not fetch HubSpot user info:', userError);
      // Non-fatal, we can continue without user info
    }

    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      clientId: finalClientId,
      clientSecret: finalClientSecret,
      userInfo: userInfo as HubSpotUserInfo,
      credential: null
    };
  } catch (error) {
    console.log('Error handling OAuth callback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      credential: null
    };
  }
}

/**
 * Create a HubSpot client from authentication result
 * This is the recommended way to create a client as it properly sets up token refresh
 * @param authResult The authentication result from handleOAuthCallback or connectToHubSpotWithApiKey
 * @returns HubSpotClient instance
 */
export function createHubSpotClient(authResult: HubSpotAuthResult): HubSpotClient {
  if (!authResult.success || !authResult.accessToken) {
    throw new Error('Cannot create HubSpot client: Invalid authentication result');
  }
  
  return new HubSpotClient(
    authResult.accessToken,
    authResult.refreshToken,
    authResult.clientId,
    authResult.clientSecret,
    authResult.expiresIn,
    authResult.credential || undefined
  );
}

/**
 * Helper function to refresh a HubSpot access token directly
 * @param refreshToken The refresh token obtained during OAuth
 * @param clientId OAuth2 client ID (optional, will use env var if not provided)
 * @param clientSecret OAuth2 client secret (optional, will use env var if not provided)
 * @returns New auth result with refreshed tokens
 */
export async function refreshHubSpotToken(
  refreshToken: string,
  clientId?: string,
  clientSecret?: string
): Promise<HubSpotAuthResult> {
  try {
    // Use provided credentials or fall back to environment variables
    const finalClientId = clientId || process.env.HUBSPOT_CLIENT_ID;
    const finalClientSecret = clientSecret || process.env.HUBSPOT_CLIENT_SECRET;
    
    if (!finalClientId || !finalClientSecret) {
      throw new Error('Missing HubSpot OAuth credentials. Provide parameters or set environment variables.');
    }
    
    // Exchange the refresh token for a new access token
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: finalClientId,
        client_secret: finalClientSecret,
        refresh_token: refreshToken
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to refresh token: ${errorData.message || response.statusText}`);
    }

    const tokenData = await response.json();
    
    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Use new one if provided, otherwise keep the old one
      expiresIn: tokenData.expires_in,
      clientId: finalClientId,
      clientSecret: finalClientSecret,
      credential: null // No stored credentials in this case
    };
  } catch (error) {
    console.log('Error refreshing HubSpot token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      credential: null
    };
  }
}
