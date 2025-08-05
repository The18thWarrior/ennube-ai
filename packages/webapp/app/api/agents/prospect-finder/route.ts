import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Prospect Finder Agent API
 * GET: Fetches data from prospect finder webhook
 * Required query parameters:
 * - limit: Maximum number of records to return
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current session to identify the user
    const session = await auth();
    
    if (!session || !session.user || !session.user.auth0) {
      return NextResponse.json(
        { error: 'You must be signed in to access the prospect finder agent' },
        { status: 401 }
      );
    }
    
    // Get user's sub from the session
    const userSub = session.user.auth0.sub;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10'; // Default to 10 if not specified
    
    // Validate the limit parameter is a number
    if (isNaN(Number(limit))) {
      return NextResponse.json(
        { error: 'limit parameter must be a number' },
        { status: 400 }
      );
    }
    
    // Get the webhook URL from environment variable
    const webhookUrl = process.env.PROSPECTFINDER_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Prospect Finder webhook URL is not configured' },
        { status: 500 }
      );
    }
    
    // Construct the URL with query parameters
    // const url = new URL(webhookUrl);
    // url.searchParams.append('limit', limit);
    // url.searchParams.append('limit', "1");
    // url.searchParams.append('sub', userSub);
    const url2 = `${webhookUrl}?limit=${limit}&subId=${userSub}`;
    console.log(`Prospect Finder webhook URL: ${url2}`);
    // Make the request to the prospect finder webhook
    const response = await fetch(url2, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Handle non-200 responses from the webhook
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from prospect finder webhook: ${errorText}`);
      return NextResponse.json(
        {
          error: 'Error from prospect finder service',
          details: errorText
        },
        { status: response.status }
      );
    }
    
    // Parse and return the webhook response
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Error accessing prospect finder agent:', error);
    return NextResponse.json(
      {
        error: 'Failed to access prospect finder agent',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
