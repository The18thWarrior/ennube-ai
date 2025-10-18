import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { handleOAuthCallback } from '@/lib/gsuite';
import { storeGSuiteCredentials } from '@/lib/db/gsuite-storage';

/**
 * GET /api/gsuite/oauth2/callback
 * Handles the OAuth2 callback from Google and stores the credentials
 * 
 * Query parameters:
 * - code: The authorization code from Google
 * 
 * Response:
 * - 200 OK: Credentials successfully stored
 * - 400 Bad Request: Missing code parameter
 * - 401 Unauthorized: User not authenticated
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
    
    // Extract the authorization code from query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }
    
    // Exchange the code for tokens
    const authResult = await handleOAuthCallback(code);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Failed to authenticate with Google' },
        { status: 400 }
      );
    }
    
    // Store the credentials in Redis
    const sessionId = await storeGSuiteCredentials(authResult);
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Failed to store credentials' },
        { status: 500 }
      );
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/integrations/gsuite/dashboard';
    console.log('GSuite authentication successful')
    return NextResponse.redirect(url);

    // Return success with user info (no sensitive tokens)
    // return NextResponse.json({
    //   success: true,
    //   userInfo: authResult.userInfo,
    //   message: 'GSuite authentication successful'
    // });
  } catch (error) {
    console.log('Error handling OAuth callback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
