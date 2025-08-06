import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGSuiteCredentialsById } from '@/lib/db/gsuite-storage';
import { createGSuiteClient } from '@/lib/gsuite';

/**
 * GET /api/gsuite/gmail/search
 * Search for emails in Gmail
 * 
 * Query parameters:
 * - query: Gmail search query (same syntax as Gmail search box)
 * - maxResults: Maximum number of results to return (default: 10)
 * - pageToken: Token for getting the next page of results
 * 
 * Response:
 * - 200 OK: Email search results
 * - 400 Bad Request: Missing query parameter
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
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const maxResults = searchParams.get('maxResults');
    const pageToken = searchParams.get('pageToken');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Missing search query parameter' },
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
    
    // Search emails
    const searchResults = await gsuiteClient.searchEmails(
      query,
      maxResults ? parseInt(maxResults) : 10,
      pageToken || undefined
    );
    
    return NextResponse.json(searchResults);
  } catch (error) {
    console.log('Error searching Gmail:', error);
    return NextResponse.json(
      { error: 'Failed to search emails: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
