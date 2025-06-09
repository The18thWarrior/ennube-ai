import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGSuiteCredentialsById } from '@/lib/db/gsuite-storage';
import { createGSuiteClient } from '@/lib/gsuite';

/**
 * GET /api/gsuite/gmail/thread/:threadId
 * Get full details of an email thread
 * 
 * Path parameters:
 * - threadId: The ID of the thread to retrieve
 * 
 * Response:
 * - 200 OK: Email thread details
 * - 400 Bad Request: Missing threadId parameter
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: No GSuite credentials found or thread not found
 * - 500 Internal Server Error: Server error
 */
type Params = Promise<{ threadId: string }>;
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session?.user?.id || !session?.user?.auth0?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const _params = await params;
    const threadId = _params.threadId;
    if (!threadId) {
      return NextResponse.json(
        { error: 'Missing thread ID' },
        { status: 400 }
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
    
    // Get email thread
    const thread = await gsuiteClient.getEmailThread(threadId);
    
    if (!thread || thread.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error retrieving email thread:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve email thread: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
