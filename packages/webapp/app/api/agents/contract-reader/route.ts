import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAgentSetting } from '@/lib/db/agent-settings-storage';

/**
 * Contract Reader API
 * GET: Fetches data from contract reader webhook
 * Required query parameters:
 * - limit: Maximum number of records to return
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current session to identify the user
    const session = await auth();
    
    if (!session || !session.user || !session.user.sub) {
      return NextResponse.json(
        { error: 'You must be signed in to access the data steward agent' },
        { status: 401 }
      );
    }
    
    // Get user's sub from the session
    const userSub = session.user.sub;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10'; // Default to 10 if not specified
    const provider = searchParams.get('provider') || 'sfdc'; // Default to 10 if not specified
    const usageId = searchParams.get('usageId'); // Default to data steward if not specified

    // Validate the limit parameter is a number
    if (isNaN(Number(limit))) {
      return NextResponse.json(
        { error: 'limit parameter must be a number' },
        { status: 400 }
      );
    }
    const setting = await getAgentSetting(userSub, 'contract-reader');
    const webhookUrl = setting?.customWorkflow || (provider === 'sfdc' ? process.env.CONTRACT_READER_WEBHOOK_URL : process.env.CONTRACT_READER_WEBHOOK_URL);
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Contract reader webhook URL is not configured' },
        { status: 500 }
      );
    }
    
    // Construct the URL with query parameters
    // const url = new URL(webhookUrl);
    // url.searchParams.append('limit', limit);
    // url.searchParams.append('limit', "1");
    // url.searchParams.append('sub', userSub);
    const url2 = `${webhookUrl}?limit=${limit}&subId=${userSub}${usageId ? `&usageId=${usageId}` : ''}`;
    console.log(`Contract reader webhook URL: ${url2}`);
    // Make the request to the contract reader webhooks
    const response = await fetch(url2, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Handle non-200 responses from the webhook
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Error from data steward webhook: ${errorText}`);
      return NextResponse.json(
        { 
          error: 'Error from contract reader service',
          details: errorText
        },
        { status: response.status }
      );
    }
    
    // Parse and return the webhook response
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.log('Error accessing contract reader agent:', error);
    return NextResponse.json(
      { 
        error: 'Failed to access contract reader agent',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
