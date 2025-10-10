import { NextRequest, NextResponse } from 'next/server';
import { removeSalesforceCredentials } from '@/lib/db/salesforce-storage';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get session ID
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }
    
    // Remove credentials from Vercel KV
    await removeSalesforceCredentials();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('Error removing Salesforce credentials:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
