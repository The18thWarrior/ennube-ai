import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAuthorizationUrl } from '@/lib/gsuite';

/**
 * GET /api/gsuite/oauth2/authorize
 * Generates the Google OAuth2 authorization URL
 * 
 * Response:
 * - 200 OK: Returns the authorization URL
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Generate the authorization URL
    try {
      const authorizationUrl = getAuthorizationUrl();
      
      return NextResponse.redirect(authorizationUrl);
    } catch (error) {
      console.log('Error generating GSuite authorization URL:', error);
      return NextResponse.json(
        { error: 'Failed to generate authorization URL' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log('Error processing authorization request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
