import { NextRequest, NextResponse } from 'next/server';
import { getHubSpotCredentialsBySub } from '@/lib/db/hubspot-storage';
import { HubSpotClient, createHubSpotClient } from '@/lib/hubspot';
import { HubSpotAuthResult } from '@/lib/types';

/**
 * API endpoint to run a HubSpot object search query
 * Requires query parameters:
 * - sub: Auth0 user sub (ID) to retrieve credentials
 * - objectType: The HubSpot object type (contacts, companies, deals, etc.)
 * - query: JSON string containing the search parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sub = searchParams.get('sub');
    const objectType = searchParams.get('objectType');
    const queryStr = searchParams.get('query');
    
    // Validate required parameters
    if (!sub) {
      console.error('Missing required parameter: sub');
      return NextResponse.json(
        { error: 'Missing required parameter: sub' },
        { status: 400 }
      );
    }
    
    if (!objectType) {
      console.error('Missing required parameter: objectType');
      return NextResponse.json(
        { error: 'Missing required parameter: objectType' },
        { status: 400 }
      );
    }
    
    let query = {};
    if (queryStr) {
      try {
        query = JSON.parse(queryStr);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid query format. Must be a valid JSON string.' },
          { status: 400 }
        );
      }
    }
    
    // Get stored credentials
    const credentials = await getHubSpotCredentialsBySub(sub);
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'No HubSpot credentials found for this user' },
        { status: 404 }
      );
    }
    
    // Create HubSpot client
    const authResult: HubSpotAuthResult = {
      success: true,
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiresIn: credentials.expiresIn,
    };
    
    const client = createHubSpotClient(authResult);
    
    // Execute the query
    const result = await client.query(objectType, query);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error executing HubSpot query:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
