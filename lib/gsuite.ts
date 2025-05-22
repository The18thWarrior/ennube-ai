import { OAuth2Client, Credentials } from 'google-auth-library';
import { gmail_v1, google, calendar_v3 } from 'googleapis';

// Interface definitions
export interface GSuiteAuthResult {
  success: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiryDate?: number | null;
  clientId?: string | null;
  clientSecret?: string | null;
  userInfo?: {
    email?: string | null;
    name?: string | null;
    picture?: string | null;
  };
  error?: string;
}

export interface GSuiteUserInfo {
  email?: string | null;
  name?: string | null;
  picture?: string | null;
}

export interface EmailSearchResult {
  totalThreads: number;
  threads: gmail_v1.Schema$Thread[];
  nextPageToken?: string | null;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: {
    text?: string;
    html?: string;
  };
  date: Date;
  attachments?: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
}

export interface ContactSearchResult {
  contacts: any[];
  nextPageToken?: string | null;
}

export interface CalendarEventSearchResult {
  events: calendar_v3.Schema$Event[];
  nextPageToken?: string | null;
}

export interface CreateCalendarEventRequest {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    optional?: boolean;
  }[];
  reminders?: {
    useDefault?: boolean;
    overrides?: {
      method: string;
      minutes: number;
    }[];
  };
  conferenceData?: {
    createRequest?: {
      requestId?: string;
      conferenceSolutionKey?: {
        type: string;
      };
    };
  };
}

export interface SendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: {
    text?: string;
    html?: string;
  };
  attachments?: {
    filename: string;
    content: string;
    encoding: 'base64' | 'binary' | 'utf8';
    mimeType: string;
  }[];
}

/**
 * GSuite API client for Gmail and Google Calendar functionality
 */
export class GSuiteClient {
  private readonly auth: OAuth2Client;
  private credentials?: Credentials;
  private gmail: gmail_v1.Gmail;
  private calendar: calendar_v3.Calendar;
  
  constructor(
    accessToken: string,
    refreshToken?: string | null,
    expiryDate?: number | null,
    clientId?: string | null,
    clientSecret?: string | null
  ) {
    // Initialize Google OAuth client
    this.auth = new OAuth2Client({
      clientId: clientId || process.env.GOOGLE_CLIENT_ID,
      clientSecret: clientSecret || process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
    
    // Set credentials
    this.credentials = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate
    };
    this.auth.setCredentials(this.credentials);
    
    // Initialize API clients
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }
  
  /**
   * Get the underlying OAuth2 client
   * This allows direct access to Google's full API for advanced use cases
   */
  getAuth(): OAuth2Client {
    return this.auth;
  }
  
  /**
   * Refresh the access token using the refresh token
   * @returns The refreshed token information or null if refresh failed
   */
  private async refreshAccessToken(): Promise<Credentials | null> {
    try {
      if (!this.credentials?.refresh_token) {
        console.warn('Cannot refresh token: Missing refresh token');
        return null;
      }
      
      const { credentials } = await this.auth.refreshAccessToken();
      this.credentials = credentials;
      
      console.log('Successfully refreshed Google access token');
      return credentials;
    } catch (error) {
      console.error('Error refreshing Google access token:', error);
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
      // Check if the error is due to an expired token
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isTokenExpired = 
        errorMsg.includes('invalid_grant') ||
        errorMsg.includes('Invalid Credentials') ||
        errorMsg.includes('token expired') ||
        errorMsg.includes('Token expired');
      
      if (isTokenExpired && this.credentials?.refresh_token) {
        console.log('Google session expired. Attempting to refresh token...');
        const refreshResult = await this.refreshAccessToken();
        
        if (refreshResult) {
          // Retry the API call with the new token
          return await apiCall();
        } else {
          throw new Error('Unable to refresh Google access token');
        }
      }
      
      // If not a token expiry issue or refresh failed, rethrow the original error
      throw error;
    }
  }
  
  /**
   * Get current user info from Google
   */
  async getUserInfo(): Promise<GSuiteUserInfo> {
    return this.withTokenRefresh(async () => {
      try {
        const response = await google.oauth2('v2').userinfo.get({
          auth: this.auth
        });
        
        return {
          email: response.data.email,
          name: response.data.name,
          picture: response.data.picture
        };
      } catch (error) {
        console.error('Error fetching Google user info:', error);
        throw new Error(`Failed to fetch user info: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Search emails in Gmail
   * @param query Gmail search query (same syntax as Gmail search box)
   * @param maxResults Maximum number of results to return
   * @param pageToken Token for getting the next page of results
   * @returns Email search results
   */
  async searchEmails(query: string, maxResults: number = 10, pageToken?: string): Promise<EmailSearchResult> {
    return this.withTokenRefresh(async () => {
      try {
        // First get thread list
        const threadResponse = await this.gmail.users.threads.list({
          userId: 'me',
          q: query,
          maxResults,
          pageToken
        });
        
        return {
          totalThreads: threadResponse.data.resultSizeEstimate || 0,
          threads: threadResponse.data.threads || [],
          nextPageToken: threadResponse.data.nextPageToken
        };
      } catch (error) {
        console.error('Error searching Gmail:', error);
        throw new Error(`Failed to search emails: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Get full details of an email thread
   * @param threadId The ID of the thread to retrieve
   * @returns Formatted email messages in the thread
   */
  async getEmailThread(threadId: string): Promise<EmailMessage[]> {
    return this.withTokenRefresh(async () => {
      try {
        const response = await this.gmail.users.threads.get({
          userId: 'me',
          id: threadId
        });
        
        const thread = response.data;
        if (!thread.messages) {
          return [];
        }
        
        // Process each message in the thread
        return thread.messages.map(message => {
          // Process headers
          const headers = message.payload?.headers || [];
          const getHeader = (name: string) => {
            const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
            return header?.value || '';
          };
          
          // Extract email addresses
          const from = getHeader('from');
          const to = getHeader('to').split(',').map(s => s.trim()).filter(Boolean);
          const cc = getHeader('cc').split(',').map(s => s.trim()).filter(Boolean);
          const bcc = getHeader('bcc').split(',').map(s => s.trim()).filter(Boolean);
          const subject = getHeader('subject');
          const date = new Date(getHeader('date'));
          
          // Extract body content
          let textBody = '';
          let htmlBody = '';
          
          // Function to extract body parts
          const extractBody = (part?: gmail_v1.Schema$MessagePart) => {
            if (!part) return;
            
            if (part.mimeType === 'text/plain' && part.body?.data) {
              textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.mimeType === 'text/html' && part.body?.data) {
              htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            } else if (part.parts) {
              part.parts.forEach(extractBody);
            }
          };
          
          extractBody(message.payload);
          
          // Extract attachments
          const attachments: EmailMessage['attachments'] = [];
          
          const extractAttachments = (part?: gmail_v1.Schema$MessagePart) => {
            if (!part) return;
            
            if (part.filename && part.body && part.headers) {
              attachments.push({
                id: part.body.attachmentId || '',
                filename: part.filename,
                mimeType: part.mimeType || 'application/octet-stream',
                size: part.body.size || 0
              });
            }
            
            if (part.parts) {
              part.parts.forEach(extractAttachments);
            }
          };
          
          extractAttachments(message.payload);
          
          return {
            id: message.id || '',
            threadId: message.threadId || '',
            from,
            to,
            cc: cc.length > 0 ? cc : undefined,
            bcc: bcc.length > 0 ? bcc : undefined,
            subject,
            body: {
              text: textBody || undefined,
              html: htmlBody || undefined
            },
            date,
            attachments: attachments.length > 0 ? attachments : undefined
          };
        });
      } catch (error) {
        console.error('Error fetching email thread:', error);
        throw new Error(`Failed to fetch email thread: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Send an email via Gmail
   * @param emailRequest Email content and recipients
   * @returns The ID of the sent message
   */
  async sendEmail(emailRequest: SendEmailRequest): Promise<string> {
    return this.withTokenRefresh(async () => {
      try {
        // Construct email headers
        const headers = [
          `To: ${emailRequest.to.join(', ')}`,
          `Subject: ${emailRequest.subject}`
        ];
        
        if (emailRequest.cc && emailRequest.cc.length > 0) {
          headers.push(`Cc: ${emailRequest.cc.join(', ')}`);
        }
        
        if (emailRequest.bcc && emailRequest.bcc.length > 0) {
          headers.push(`Bcc: ${emailRequest.bcc.join(', ')}`);
        }
        
        // Construct email body
        let body = '';
        const boundary = `boundary_${Date.now().toString(16)}`;
        
        headers.push('MIME-Version: 1.0');
        headers.push(`Content-Type: multipart/alternative; boundary=${boundary}`);
        
        if (emailRequest.body.text) {
          body += `\r\n--${boundary}\r\n`;
          body += 'Content-Type: text/plain; charset=UTF-8\r\n\r\n';
          body += emailRequest.body.text;
        }
        
        if (emailRequest.body.html) {
          body += `\r\n--${boundary}\r\n`;
          body += 'Content-Type: text/html; charset=UTF-8\r\n\r\n';
          body += emailRequest.body.html;
        }
        
        // Add attachments if any
        if (emailRequest.attachments && emailRequest.attachments.length > 0) {
          for (const attachment of emailRequest.attachments) {
            body += `\r\n--${boundary}\r\n`;
            body += `Content-Type: ${attachment.mimeType}\r\n`;
            body += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
            body += `Content-Transfer-Encoding: ${attachment.encoding}\r\n\r\n`;
            body += attachment.content;
          }
        }
        
        body += `\r\n--${boundary}--`;
        
        // Combine headers and body
        const message = headers.join('\r\n') + '\r\n\r\n' + body;
        
        // Encode the message in base64
        const encodedMessage = Buffer.from(message).toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        // Send the message
        const response = await this.gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage
          }
        });
        
        return response.data.id || '';
      } catch (error) {
        console.error('Error sending email:', error);
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Search contacts in Google Contacts
   * @param query Search query
   * @param pageSize Maximum number of results per page
   * @param pageToken Token for getting the next page of results
   * @returns Contact search results
   */
  async searchContacts(query: string, pageSize: number = 10, pageToken?: string): Promise<ContactSearchResult> {
    return this.withTokenRefresh(async () => {
      try {
        // Initialize People API client
        const peopleApi = google.people({ version: 'v1', auth: this.auth });
        
        // Search for contacts
        const response = await peopleApi.people.connections.list({
          resourceName: 'people/me',
          pageSize,
          pageToken,
          personFields: 'names,emailAddresses,phoneNumbers,organizations,photos',
          sortOrder: 'LAST_MODIFIED_DESCENDING'
        });
        
        return {
          contacts: response.data.connections || [],
          nextPageToken: response.data.nextPageToken
        };
      } catch (error) {
        console.error('Error searching contacts:', error);
        throw new Error(`Failed to search contacts: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Search calendar events
   * @param query Text search term
   * @param timeMin Start time for the search
   * @param timeMax End time for the search
   * @param maxResults Maximum number of results
   * @param pageToken Token for getting the next page of results
   * @returns Calendar event search results
   */
  async searchCalendarEvents(
    query?: string,
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 10,
    pageToken?: string
  ): Promise<CalendarEventSearchResult> {
    return this.withTokenRefresh(async () => {
      try {
        const response = await this.calendar.events.list({
          calendarId: 'primary',
          q: query,
          timeMin,
          timeMax,
          maxResults,
          pageToken,
          singleEvents: true,
          orderBy: 'startTime'
        });
        
        return {
          events: response.data.items || [],
          nextPageToken: response.data.nextPageToken
        };
      } catch (error) {
        console.error('Error searching calendar events:', error);
        throw new Error(`Failed to search calendar events: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  /**
   * Create a new calendar event
   * @param eventRequest Calendar event details
   * @returns The created event
   */
  async createCalendarEvent(eventRequest: CreateCalendarEventRequest): Promise<calendar_v3.Schema$Event> {
    return this.withTokenRefresh(async () => {
      try {
        const response = await this.calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventRequest,
          conferenceDataVersion: eventRequest.conferenceData ? 1 : 0
        });
        
        return response.data;
      } catch (error) {
        console.error('Error creating calendar event:', error);
        throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
}

/**
 * Generate Google OAuth2 authorization URL
 * @param clientId Google OAuth2 client ID (optional, will use env var if not provided)
 * @param clientSecret Google OAuth2 client secret (optional, will use env var if not provided)
 * @param redirectUri Callback URI for Google OAuth2 (optional, will use env var if not provided)
 * @returns Authorization URL
 */
export function getAuthorizationUrl(
  clientId?: string,
  clientSecret?: string,
  redirectUri?: string
): string {
  // Use provided credentials or fall back to environment variables
  const finalClientId = clientId || process.env.GOOGLE_CLIENT_ID;
  const finalClientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const finalRedirectUri = redirectUri || process.env.GOOGLE_REDIRECT_URI;
  
  if (!finalClientId || !finalClientSecret || !finalRedirectUri) {
    throw new Error('Missing Google OAuth credentials. Provide parameters or set environment variables.');
  }

  const oauth2Client = new OAuth2Client({
    clientId: finalClientId,
    clientSecret: finalClientSecret,
    redirectUri: finalRedirectUri
  });

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'consent' // Force re-consent to get refresh token
  });
}

/**
 * Handle Google OAuth2 callback and exchange authorization code for access token
 * @param code Authorization code received from Google
 * @param clientId Google OAuth2 client ID (optional, will use env var if not provided)
 * @param clientSecret Google OAuth2 client secret (optional, will use env var if not provided)
 * @param redirectUri Callback URI for Google OAuth2
 * @returns Authentication result with access token and refresh token
 */
export async function handleOAuthCallback(
  code: string,
  clientId?: string,
  clientSecret?: string,
  redirectUri?: string
): Promise<GSuiteAuthResult> {
  try {
    // Use provided credentials or fall back to environment variables
    const finalClientId = clientId || process.env.GOOGLE_CLIENT_ID;
    const finalClientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    const finalRedirectUri = redirectUri || process.env.GOOGLE_REDIRECT_URI;
    
    if (!finalClientId || !finalClientSecret || !finalRedirectUri) {
      throw new Error('Missing Google OAuth credentials. Provide parameters or set environment variables.');
    }
    
    const oauth2Client = new OAuth2Client({
      clientId: finalClientId,
      clientSecret: finalClientSecret,
      redirectUri: finalRedirectUri
    });

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Set the credentials on the OAuth2 client
    oauth2Client.setCredentials(tokens);
    
    // Get user info
    const userInfoResponse = await google.oauth2('v2').userinfo.get({
      auth: oauth2Client
    });
    
    const userInfo = userInfoResponse.data;
    
    return {
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      clientId: finalClientId,
      clientSecret: finalClientSecret,
      userInfo: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    };
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Create a GSuite client from authentication result
 * This is the recommended way to create a client as it properly sets up token refresh
 * @param authResult The authentication result from handleOAuthCallback
 * @returns GSuiteClient instance
 */
export function createGSuiteClient(authResult: GSuiteAuthResult): GSuiteClient {
  if (!authResult.success || !authResult.accessToken) {
    throw new Error('Cannot create GSuite client: Invalid authentication result');
  }
  
  return new GSuiteClient(
    authResult.accessToken,
    authResult.refreshToken,
    authResult.expiryDate,
    authResult.clientId,
    authResult.clientSecret
  );
}

/**
 * Helper function to refresh a Google access token directly
 * @param refreshToken The refresh token obtained during OAuth
 * @param clientId OAuth2 client ID (optional, will use env var if not provided)
 * @param clientSecret OAuth2 client secret (optional, will use env var if not provided)
 * @returns New auth result with refreshed tokens
 */
export async function refreshGoogleToken(
  refreshToken: string,
  clientId?: string,
  clientSecret?: string
): Promise<GSuiteAuthResult> {
  try {
    // Use provided credentials or fall back to environment variables
    const finalClientId = clientId || process.env.GOOGLE_CLIENT_ID;
    const finalClientSecret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    
    if (!finalClientId || !finalClientSecret) {
      throw new Error('Missing Google OAuth credentials. Provide parameters or set environment variables.');
    }
    
    const oauth2Client = new OAuth2Client({
      clientId: finalClientId,
      clientSecret: finalClientSecret
    });
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      success: true,
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || refreshToken, // Use new one if provided, otherwise keep the old one
      expiryDate: credentials.expiry_date,
      clientId: finalClientId,
      clientSecret: finalClientSecret
    };
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}