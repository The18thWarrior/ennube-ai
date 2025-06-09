import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSalesforceCredentialsById } from '@/lib/db/salesforce-storage';

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
    
    // Remove sensitive data before returning
    const sanitizedCredentials = {
      ...credentials,
      // Remove token-related sensitive data but keep metadata
      accessToken: undefined,
      refreshToken: undefined,
      // Keep basic user info and expiry information
      hasCredentials: true,
      instanceUrl: credentials.instanceUrl,
      userInfo: {
        display_name: credentials.userInfo?.display_name,
        email: credentials.userInfo?.email,
        organization_id: credentials.userInfo?.organization_id || credentials.userInfo?.organizationId
      },
      expiresAt: credentials.expiresAt
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
