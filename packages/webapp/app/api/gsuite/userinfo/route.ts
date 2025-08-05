import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGSuiteCredentialsById } from '@/lib/db/gsuite-storage';
import { createGSuiteClient } from '@/lib/gsuite';

/**
 * GET /api/gsuite/userinfo
 * Get current user info from Google
 * 
 * Response:
 * - 200 OK: User info (email, name, picture)
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: No GSuite credentials found
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
    
    // Get GSuite credentials
    const credentials = await getGSuiteCredentialsById();
    
    if (!credentials || !credentials.accessToken) {
      return NextResponse.json(
        { error: 'No GSuite credentials found - please connect your Google account' },
        { status: 404 }
      );
    }
    
    // Create GSuite client
    const gsuiteClient = createGSuiteClient({
      success: true,
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken || null,
      expiryDate: credentials.expiryDate || null,
      clientId: credentials.clientId || null,
      clientSecret: credentials.clientSecret || null
    });
    
    // Get user info
    const userInfo = await gsuiteClient.getUserInfo();
    
    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('Error retrieving GSuite user info:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user info: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
