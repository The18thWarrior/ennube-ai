import { NextRequest, NextResponse } from 'next/server';
import { removeHubSpotCredentials } from '@/lib/db/hubspot-storage';

/**
 * POST /api/hubspot/logout
 * Removes HubSpot credentials for the authenticated user
 * 
 * Request body (optional):
 * - sessionId: Session ID for verification (can be used for additional security)
 * 
 * Response:
 * - 200 OK: Credentials successfully removed
 * - 500 Internal Server Error: Error removing credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get session ID if provided
    const body = await request.json().catch(() => ({}));
    const { sessionId } = body;
    
    // Remove HubSpot credentials from the database
    await removeHubSpotCredentials();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing HubSpot credentials:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
