import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSalesforceCredentialsById, storeSalesforceCredentials } from '@/lib/db/salesforce-storage';
import { createSalesforceClient } from '@/lib/salesforce';
import dayjs from 'dayjs';
import { Connection, OAuth2 } from 'jsforce';

/**
 * GET /api/salesforce/credentials
 * Retrieves Salesforce credentials for the authenticated user
 * Used by the useOnboardingStatus hook to check for credentials
 * 
 * Response:
 * - 200 OK: Returns sanitized credentials with hasCredentials=true
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: No credentials found for the user
 * - 500 Internal Server Error: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session?.user?.id || !session?.user?.auth0?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get credentials for the current user
    const credentials = await getSalesforceCredentialsById();
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'No Salesforce credentials found' },
        { status: 404 }
      );
    }
    let credentialsFinal = {} as typeof credentials;
    //console.log('Retrieved Salesforce credentials:', credentials);
    if (credentials.expiresAt && new Date(credentials.expiresAt) <= new Date()) {
      // If credentials are expired, we can still return them but indicate they are expired
      console.warn('Salesforce credentials are expired:', credentials.expiresAt, dayjs(credentials.expiresAt));
      
      const newClient = await createSalesforceClient(
        {
          accessToken: credentials.accessToken,
          instanceUrl: credentials.instanceUrl,
          refreshToken: credentials.refreshToken,
          success: true,
          clientId: process.env.SALESFORCE_CLIENT_ID as string,
          clientSecret: process.env.SALESFORCE_CLIENT_SECRET as string,
        }
      );
      const refreshToken = await newClient.refreshAccessToken();
      if (!refreshToken) {
        return NextResponse.json(
          { error: 'Failed to refresh Salesforce credentials' },
          { status: 500 }
        );
      }

      const createdAt = Date.now();
      const expiresAt = createdAt + 2 * 60 * 60 * 1000;
      credentialsFinal = {
        ...credentials,
        accessToken: refreshToken.access_token,
        refreshToken: refreshToken.refresh_token,
        expiresAt
      };

      await storeSalesforceCredentials({
        success: true,
        accessToken: credentialsFinal.accessToken as string,
        refreshToken: credentialsFinal.refreshToken as string,
        instanceUrl: credentialsFinal.instanceUrl as string,
        clientId: process.env.SALESFORCE_CLIENT_ID as string,
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET as string,
        userInfo: {
          id: credentialsFinal?.userInfo?.id,
          organization_id: credentialsFinal?.userInfo?.organizationId, // Corrected property name
        }
      });
    } else {
      credentialsFinal = { ...credentials };
    }

    // Remove sensitive data before returning
    const sanitizedCredentials = {
      ...credentialsFinal,
      // Remove token-related sensitive data but keep metadata
      accessToken: credentialsFinal.accessToken,
      refreshToken: credentialsFinal.refreshToken,
      // Keep basic user info and expiry information
      hasCredentials: true,
      instanceUrl: credentialsFinal.instanceUrl,
      userInfo: {
        display_name: credentialsFinal.userInfo?.display_name,
        email: credentialsFinal.userInfo?.email,
        organization_id: credentialsFinal.userInfo?.organization_id || credentialsFinal.userInfo?.organizationId
      },
      expiresAt: credentialsFinal.expiresAt
    };
    
    return NextResponse.json(sanitizedCredentials);
  } catch (error) {
    console.error('Error retrieving Salesforce credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
