import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getHubSpotCredentialsById } from '@/lib/db/hubspot-storage';

/**
 * GET /api/hubspot/credentials
 * Retrieves HubSpot credentials for the authenticated user
 * Used to check if the user has connected to HubSpot
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
    const credentials = await getHubSpotCredentialsById();
    
    if (!credentials) {
      return NextResponse.json(
        { hasCredentials: false },
        { status: 404 }
      );
    }

    // Return sanitized credentials (no sensitive data)
    return NextResponse.json({
      hasCredentials: true,
      userEmail: credentials.userInfo?.email,
      expiresAt: credentials.expiresAt
    });
  } catch (error) {
    console.error('Error retrieving HubSpot credentials:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        hasCredentials: false 
      },
      { status: 500 }
    );
  }
}
