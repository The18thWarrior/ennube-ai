import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGSuiteCredentialsById } from '@/lib/db/gsuite-storage';
import { createGSuiteClient } from '@/lib/gsuite';
import { time } from 'console';

/**
 * GET /api/gsuite/calendar/events
 * Search for calendar events
 * 
 * Query parameters:
 * - query: Optional text search term
 * - timeMin: Optional start time for search (RFC3339 timestamp)
 * - timeMax: Optional end time for search (RFC3339 timestamp)
 * - maxResults: Maximum number of results to return (default: 10)
 * - pageToken: Token for getting the next page of results
 * 
 * Response:
 * - 200 OK: Calendar event search results
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
    const query = searchParams.get('query') || undefined;
    const date = searchParams.get('date');
    
    // If date parameter is provided, parse it to create timeMin
    let timeMin = searchParams.get('timeMin') || undefined;
    if (date && !timeMin) {
      // Parse the date parameter (expected format: YYYY-MM-DD)
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        // Set timeMin to the beginning of the provided day in ISO format
        parsedDate.setHours(0, 0, 0, 0);
        timeMin = parsedDate.toISOString();
      }
    }
    
    const timeMax = searchParams.get('timeMax') || undefined;
    const maxResults = searchParams.get('maxResults') || '10'; // Default to 10 results
    const pageToken = searchParams.get('pageToken') || undefined;
    console.log('Calendar query params:', { date, timeMin, timeMax, maxResults, pageToken });
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
    
    // Search calendar events
    const searchResults = await gsuiteClient.searchCalendarEvents(
      query,
      timeMin,
      timeMax,
      parseInt(maxResults),
      pageToken
    );
    
    return NextResponse.json(searchResults);
  } catch (error) {
    console.error('Error searching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to search calendar events: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
