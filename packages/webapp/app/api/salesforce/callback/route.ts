import { handleOAuthCallback } from '@/lib/salesforce';
import { storeSalesforceCredentials } from '@/lib/db/salesforce-storage';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Parse the request body to get session ID
    const code = request.nextUrl.searchParams.get('code');
    console.log('Received code:', code);
    if (!code) return NextResponse.json({ success: false, error: 'Missing code parameter' }, { status: 400 });
    
    const authResult = await handleOAuthCallback(code, process.env.SALESFORCE_CLIENT_ID as string, process.env.SALESFORCE_CLIENT_SECRET as string,  process.env.SALESFORCE_REDIRECT_URI as string, request.headers.get('referer') || "");
    await storeSalesforceCredentials(authResult);    
    const url = request.nextUrl.clone()
    url.pathname = '/integrations/salesforce/dashboard';
    console.log('compeleted storage of salesforce credentials')
    return NextResponse.redirect(url);
  } catch (error) {
    console.log('Error getting Salesforce credentials:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
