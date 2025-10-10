import { getAuthorizationUrl } from '@/lib/salesforce';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Parse the request body to get session ID
    const loginUrl = request.nextUrl.searchParams.get('loginUrl');
    
    // Remove credentials from Vercel KV
    const authUrl = await getAuthorizationUrl(process.env.SALESFORCE_CLIENT_ID as string, process.env.SALESFORCE_CLIENT_SECRET as string, process.env.SALESFORCE_REDIRECT_URI as string, loginUrl || 'https://login.salesforce.com');
    console.log('Salesforce auth URL:', authUrl);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.log('Error getting Salesforce auth url:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
