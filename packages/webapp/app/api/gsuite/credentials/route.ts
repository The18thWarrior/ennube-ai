import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGSuiteCredentialsById } from '@/lib/db/gsuite-storage';

/**
 * GET /api/gsuite/credentials
 * Retrieves GSuite credentials for the authenticated user
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
    
    if (!session?.user?.id || !session?.user.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get credentials for the current user
    const credentials = await getGSuiteCredentialsById();
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'No GSuite credentials found' },
        { status: 404 }
      );
    }
    
    // Remove sensitive data before returning
    const sanitizedCredentials = {
      ...credentials,
      // Remove token-related sensitive data but keep metadata
      accessToken: undefined,
      refreshToken: undefined,
      clientId: undefined,
      clientSecret: undefined,
      // Keep basic user info and expiry information
      hasCredentials: true,
      userInfo: {
        email: credentials.userInfo?.email,
        name: credentials.userInfo?.name,
        picture: credentials.userInfo?.picture
      },
      expiresAt: credentials.expiresAt,
      createdAt: credentials.createdAt
    };
    
    return NextResponse.json(sanitizedCredentials);
  } catch (error) {
    console.log('Error retrieving GSuite credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
