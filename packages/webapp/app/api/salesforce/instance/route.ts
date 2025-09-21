import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSalesforceCredentialsById } from '@/lib/db/salesforce-storage';

/**
 * GET /api/salesforce/instance
 * Returns the Salesforce instance URL for the authenticated user's stored credentials.
 * If no credentials or instanceUrl is found, returns the default https://login.salesforce.com
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.auth0?.sub) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const credentials = await getSalesforceCredentialsById();

    const instanceUrl = credentials?.instanceUrl || 'https://login.salesforce.com';

    return NextResponse.json({ instanceUrl });
  } catch (error) {
    console.log('Error retrieving Salesforce instance URL:', error);
    return NextResponse.json({ instanceUrl: 'https://login.salesforce.com' });
  }
}
