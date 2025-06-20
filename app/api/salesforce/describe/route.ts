
import { NextRequest, NextResponse } from 'next/server';
import { getSalesforceCredentialsBySub } from '@/lib/db/salesforce-storage';
import { SalesforceClient, createSalesforceClient } from '@/lib/salesforce';
import { SalesforceAuthResult } from '@/lib/types';

// GET /api/salesforce/describe?sub=...&sobjectType=...
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sub = searchParams.get('sub');
    const sobjectType = searchParams.get('sobjectType');
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
      accessToken: credentials.accessToken,
      instanceUrl: credentials.instanceUrl,
      refreshToken: credentials.refreshToken,
      userInfo: credentials.userInfo
    };
    const client = createSalesforceClient(authResult);

    if (sobjectType) {
      // Describe a specific object
      const describe = await client.describe(sobjectType);
      return NextResponse.json({ describe });
    } else {
      // Describe all objects (describeGlobal)
      const describeGlobal = await client.describeGlobal();
      return NextResponse.json({ describeGlobal });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
