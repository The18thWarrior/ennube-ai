
import { NextRequest, NextResponse } from 'next/server';
import { getSalesforceCredentialsBySub } from '@/lib/db/salesforce-storage';
import { SalesforceClient, createSalesforceClient } from '@/lib/salesforce';
import { SalesforceAuthResult } from '@/lib/types';
import { auth } from '@/auth';
import { insertLog } from '@/lib/db/log-storage';
/**
 * API route to handle Salesforce URL operations.
 * 
 * This route allows fetching Salesforce records by URL or describing global objects.
 * It requires user authentication and retrieves Salesforce credentials from the database.
 * 
 * GET Parameters:
 * - sub: User's Auth0 sub identifier (optional, defaults to session user)
 * - url: Salesforce record URL to fetch (optional)
 * 
 * Returns:
 * - JSON response with record data or global object description
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const _sub = searchParams.get('sub');
    const url = searchParams.get('url');

    const session = await auth();
    const sub = _sub || session?.user?.auth0?.sub;
    if (!sub) {
      return NextResponse.json({ error: 'Missing required parameter: sub' }, { status: 400 });
    }    

    // Get Salesforce credentials for the user
    const credentials = await getSalesforceCredentialsBySub(sub);
    if (!credentials) {
      return NextResponse.json({ error: 'No Salesforce credentials found for this user' }, { status: 404 });
    }

    // Create a Salesforce client from the stored credentials
    const authResult: SalesforceAuthResult = {
      success: true,
      userId: sub,
      accessToken: credentials.accessToken,
      instanceUrl: credentials.instanceUrl,
      refreshToken: credentials.refreshToken,
      userInfo: credentials.userInfo
    };
    const client = createSalesforceClient(authResult);

    if (url) {
      // Fetch Salesforce record by URL
      const record = await client.getByUrl(url);
      await insertLog({
        userId: sub,
        type: 'query',
        action: `Retrieved file by URL: ${url}`,
        credits: 1 // Assuming each query costs 1 credit, adjust as needed
      });
      return new NextResponse(record, { headers: { 'content-type': 'application/json' } });
    } else {
      // Describe all objects (describeGlobal)
      const describeGlobal = await client.describeGlobal();
      return NextResponse.json({ describeGlobal });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
