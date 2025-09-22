import { NextRequest, NextResponse } from 'next/server';
import { getSalesforceCredentialsBySub } from '@/lib/db/salesforce-storage';
import { SalesforceClient, createSalesforceClient } from '@/lib/salesforce';
import { SalesforceAuthResult } from '@/lib/types';
import { insertLog } from '@/lib/db/log-storage';

/**
 * API endpoint to run a Salesforce SOQL query
 * Requires query parameters:
 * - sub: Auth0 user sub (ID) to retrieve credentials
 * - soql: The SOQL query string to execute
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    //console.log(request.nextUrl);
    const searchParams = request.nextUrl.searchParams;
    const sub = searchParams.get('sub');
    const soql = searchParams.get('soql');
    
    // Validate required parameters
    if (!sub) {
      console.log('Missing required parameter: sub');
      return NextResponse.json(
        { error: 'Missing required parameter: sub' },
        { status: 400 }
      );
    }
    
    if (!soql) {
      console.log('Missing required parameter: soql');
      return NextResponse.json(
        { error: 'Missing required parameter: soql' },
        { status: 400 }
      );
    }
    
    // Get Salesforce credentials for the user
    const credentials = await getSalesforceCredentialsBySub(sub);
    
    if (!credentials) {
      console.log(`No Salesforce credentials found for user: ${sub}`);
      return NextResponse.json(
        { error: 'No Salesforce credentials found for this user' },
        { status: 404 }
      );
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
    //console.log('Salesforce credentials:', credentials);
    const salesforceClient = createSalesforceClient(authResult);
    
    // Execute the SOQL query
    const queryResult = await salesforceClient.query(soql);
    
    await insertLog({
      userId: sub,
      type: 'query',
      action: `Executed SOQL: ${soql}`,
      credits: 1 // Assuming each query costs 1 credit, adjust as needed
    });

    // Return the query results
    return NextResponse.json(queryResult);
    
  } catch (error) {
    console.log('Error executing Salesforce query:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        error: 'Failed to execute Salesforce query',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
