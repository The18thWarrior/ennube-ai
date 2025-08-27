
import { NextRequest, NextResponse } from 'next/server';
import { getSalesforceCredentialsBySub } from '@/lib/db/salesforce-storage';
import { SalesforceClient, createSalesforceClient } from '@/lib/salesforce';
import { SalesforceAuthResult } from '@/lib/types';
import { auth } from '@/auth';

const STANDARD_OBJECTS = ['Account', 'Contact', 'Lead', 'Opportunity', 'Case', 'User', 'Campaign', 'Task', 'Event', 'Contract', 'Order', 'ContentVersion', 'Attachment', 'Note'];

// GET /api/salesforce/describe?sub=...&sobjectType=...
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const _sub = searchParams.get('sub');
    const sobjectType = searchParams.get('sobjectType');

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

    if (sobjectType) {
      // Describe a specific object
      console.log('Describing object:', sobjectType);
      const describe = await client.describe(sobjectType);
      console.log(describe);
      return NextResponse.json({ describe });
    } else {
      // Describe all objects (describeGlobal)
      const describeGlobal = await client.describeGlobal();
      const objectResult = describeGlobal.sobjects.filter(obj => obj.custom || STANDARD_OBJECTS.includes(obj.name)).map((obj) => ({
        name: obj.name,
        label: obj.label,
        keyPrefix: obj.keyPrefix
      }));
      return NextResponse.json({ objectResult });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
