
import { NextRequest, NextResponse } from 'next/server';
import { getSalesforceCredentialsBySub } from '@/lib/db/salesforce-storage';
import { SalesforceClient, createSalesforceClient } from '@/lib/salesforce';
import { SalesforceAuthResult } from '@/lib/types';
import { auth } from '@/auth';

const PACKAGE_NAMESPACE = process.env.NEXT_PUBLIC_SFDC_MANAGED_PACKAGE_NAMESPACE as string;
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const _sub = searchParams.get('sub');

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

    // Fetch Salesforce record by URL
    const isPackageInstalled = await client.isPackageInstalled(PACKAGE_NAMESPACE);
    return NextResponse.json({ isPackageInstalled });

  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
