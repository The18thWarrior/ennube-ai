import { handleOAuthCallback } from '@/lib/hubspot';
import { storeHubSpotCredentials } from '@/lib/db/hubspot-storage';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Parse the request body to get code parameter
    const code = request.nextUrl.searchParams.get('code');
    console.log('Received HubSpot code:', code);
    
    if (!code) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing code parameter' 
      }, { status: 400 });
    }
    
    // Handle the OAuth callback and get the tokens
    const authResult = await handleOAuthCallback(
      code,
      process.env.HUBSPOT_CLIENT_ID as string,
      process.env.HUBSPOT_CLIENT_SECRET as string,
      process.env.HUBSPOT_REDIRECT_URI as string
    );
    
    // Store the credentials in the database
    await storeHubSpotCredentials(authResult);
    
    // Redirect to the HubSpot dashboard
    const url = request.nextUrl.clone();
    url.pathname = '/integrations/hubspot/dashboard';
    console.log('Completed storage of HubSpot credentials');
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Error handling HubSpot OAuth callback:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
