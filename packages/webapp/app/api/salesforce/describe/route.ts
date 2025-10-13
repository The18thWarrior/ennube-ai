
import { NextRequest, NextResponse } from 'next/server';
import { getSalesforceCredentialsBySub } from '@/lib/db/salesforce-storage';
import { SalesforceClient, createSalesforceClient } from '@/lib/salesforce';
import { DescribeResultType, SalesforceAuthResult } from '@/lib/types';
import { auth } from '@/auth';
import { getDescribe, setDescribe, getGlobalDescribe, setGlobalDescribe } from '@/lib/cache/salesforce/describe-history';
import { DescribeGlobalResult, DescribeSObjectResult } from 'jsforce';

const STANDARD_OBJECTS = ['Account', 'Contact', 'Lead', 'Opportunity', 'OpportunityLineItem', 'Product2', 'Quote', 'Case', 'User', 'Campaign', 'Task', 'Event', 'Contract', 'Order', 'ContentVersion', 'Attachment', 'Note'];

// GET /api/salesforce/describe?sub=...&sobjectType=...
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const _sub = searchParams.get('sub');
    const sobjectType = searchParams.get('sobjectType');
    const addFields = searchParams.get('addFields') as string === 'false' ? false : true;
    const addRelationships = searchParams.get('addRelationships') as string === 'false' ? false : true;

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
      // Try cache first
      let describe: DescribeSObjectResult | null = await getDescribe(sub, sobjectType);
      if (!describe) {
        describe = await client.describe(sobjectType);
        // Save to cache for subsequent requests
        if (!describe) return NextResponse.json({ error: 'Failed to describe object' }, { status: 500 });
        await setDescribe(sub, sobjectType, describe);
      } else {
        console.log('Using cached describe result');
      }
      //console.log(describe);
      // Typed shape for the describe result returned to the client
      

      const describeResult: DescribeResultType = {
        name: describe.name,
        label: describe.label,
        keyPrefix: describe.keyPrefix,
        fields: addFields
          ? (describe.fields || []).map((field: any) => ({
              calculatedFormula: field.calculatedFormula ?? null,
              digits: field.digits ?? null,
              externalId: field.externalId ?? null,
              inlineHelpText: field.inlineHelpText ?? null,
              label: field.label ?? null,
              length: field.length ?? null,
              name: field.name,
              picklistValues: field.picklistValues ?? [],
              precision: field.precision ?? null,
              relationshipName: field.relationshipName ?? null,
              type: field.type ?? null
            }))
          : [],
        childRelationships: addRelationships
          ? (describe.childRelationships || [])
              .filter((child: any) => !child.deprecatedAndHidden && child.relationshipName)
              .map((child: any) => ({
                childSObject: child.childSObject,
                field: child.field,
                relationshipName: child.relationshipName
              }))
          : []
      };
      return NextResponse.json({ describe: describeResult });
    } else {
      // Describe all objects (describeGlobal)
      let describeGlobal: DescribeGlobalResult | null = await getGlobalDescribe(sub);
      if (!describeGlobal) {
        describeGlobal = await client.describeGlobal();
        if (!describeGlobal) return NextResponse.json({ error: 'Failed to describe global objects' }, { status: 500 });
        await setGlobalDescribe(sub, describeGlobal);
      } else {
        console.log('Using cached describe global result');
      }
      const objectResult = describeGlobal.sobjects.filter((obj: any) => obj.custom || STANDARD_OBJECTS.includes(obj.name)).map((obj: any) => ({
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
