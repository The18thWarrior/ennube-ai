import { NextRequest, NextResponse } from 'next/server';
import { getSalesforceCredentialsBySub } from '@/lib/db/salesforce-storage';
import { createSalesforceClient, SalesforceClient } from '@/lib/salesforce';
import { SalesforceAuthResult } from '@/lib/types';
/**
 * Helper function to get a Salesforce client from the sub parameter
 */
async function getSalesforceClientFromSub(request: NextRequest): Promise<{ 
  client: SalesforceClient | null, 
  error: NextResponse | null,
  sobjectType: string | null 
}> {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const sub = searchParams.get('sub');
  const sobjectType = searchParams.get('sobjectType');
  
  // Validate required parameters
  if (!sub) {
    return {
      client: null,
      error: NextResponse.json(
        { error: 'Missing required parameter: sub' },
        { status: 400 }
      ),
      sobjectType: null
    };
  }
  
  if (!sobjectType) {
    return {
      client: null,
      error: NextResponse.json(
        { error: 'Missing required parameter: sobjectType' },
        { status: 400 }
      ),
      sobjectType: null
    };
  }
  
  // Get Salesforce credentials for the user
  const credentials = await getSalesforceCredentialsBySub(sub);
  
  if (!credentials) {
    return {
      client: null,
      error: NextResponse.json(
        { error: 'No Salesforce credentials found for this user' },
        { status: 404 }
      ),
      sobjectType: null
    };
  }
  
  // Create a Salesforce client from the stored credentials
  const authResult: SalesforceAuthResult = {
    success: true,
    accessToken: credentials.accessToken,
    instanceUrl: credentials.instanceUrl,
    refreshToken: credentials.refreshToken,
    userInfo: credentials.userInfo
  };
  
  const salesforceClient = createSalesforceClient(authResult);
  
  return {
    client: salesforceClient,
    error: null,
    sobjectType
  };
}

/**
 * POST: Batch create records in Salesforce
 * Required query parameters:
 * - sub: Auth0 user sub (ID) to retrieve credentials
 * - sobjectType: The Salesforce object type (e.g., 'Account', 'Contact')
 * Request body should contain an array of records to create
 * Optional: 'operation' in query/body (defaults to 'create')
 */
export async function POST(request: NextRequest) {
  try {
    const { client, error, sobjectType } = await getSalesforceClientFromSub(request);
    if (error) return error;
    if (!client || !sobjectType) {
      return NextResponse.json({ error: 'Failed to initialize Salesforce client' }, { status: 500 });
    }
    const body = await request.json();
    // Accepts either { records: [...] } or just an array
    const records = Array.isArray(body) ? body : body.records;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Request body must be a non-empty array of records or { records: [...] }' }, { status: 400 });
    }
    // Allow operation override via query or body
    const opFromQuery = request.nextUrl.searchParams.get('operation');
    const operation = opFromQuery || body.operation || 'create';
    if (!['create', 'update', 'delete'].includes(operation)) {
      return NextResponse.json({ error: `Invalid operation: ${operation}` }, { status: 400 });
    }
    const results = await client.batch(operation, sobjectType, records);
    return NextResponse.json({ success: true, operation, results });
  } catch (error) {
    console.error('Error in Salesforce batch operation:', error);
    return NextResponse.json({ error: 'Failed to perform Salesforce batch operation', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

/**
 * PUT: Batch update records in Salesforce
 * Required query parameters:
 * - sub: Auth0 user sub (ID) to retrieve credentials
 * - sobjectType: The Salesforce object type (e.g., 'Account', 'Contact')
 * Request body should contain an array of records to update (each must include Id)
 * Optional: 'operation' in query/body (defaults to 'update')
 */
export async function PUT(request: NextRequest) {
  try {
    const { client, error, sobjectType } = await getSalesforceClientFromSub(request);
    if (error) return error;
    if (!client || !sobjectType) {
      return NextResponse.json({ error: 'Failed to initialize Salesforce client' }, { status: 500 });
    }
    const body = await request.json();
    const records = Array.isArray(body) ? body : body.records;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Request body must be a non-empty array of records or { records: [...] }' }, { status: 400 });
    }
    // Allow operation override via query or body
    const opFromQuery = request.nextUrl.searchParams.get('operation');
    const operation = opFromQuery || body.operation || 'update';
    if (operation !== 'update') {
      return NextResponse.json({ error: `Invalid operation for PUT: ${operation}` }, { status: 400 });
    }
    // Validate all records have Id
    const missingId = records.find((r: any) => !r.Id);
    if (missingId) {
      return NextResponse.json({ error: 'All records must include an Id field for update operations.' }, { status: 400 });
    }
    const results = await client.batch('update', sobjectType, records);
    return NextResponse.json({ success: true, operation: 'update', results });
  } catch (error) {
    console.error('Error in Salesforce batch update:', error);
    return NextResponse.json({ error: 'Failed to perform Salesforce batch update', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

/**
 * DELETE: Batch delete records in Salesforce
 * Required query parameters:
 * - sub: Auth0 user sub (ID) to retrieve credentials
 * - sobjectType: The Salesforce object type (e.g., 'Account', 'Contact')
 * Request body should contain an array of records (with Id or id fields) to delete
 * Optional: 'operation' in query/body (defaults to 'delete')
 */
export async function DELETE(request: NextRequest) {
  try {
    const { client, error, sobjectType } = await getSalesforceClientFromSub(request);
    if (error) return error;
    if (!client || !sobjectType) {
      return NextResponse.json({ error: 'Failed to initialize Salesforce client' }, { status: 500 });
    }
    const body = await request.json();
    const records = Array.isArray(body) ? body : body.records;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Request body must be a non-empty array of records or { records: [...] }' }, { status: 400 });
    }
    // Allow operation override via query or body
    const opFromQuery = request.nextUrl.searchParams.get('operation');
    const operation = opFromQuery || body.operation || 'delete';
    if (operation !== 'delete') {
      return NextResponse.json({ error: `Invalid operation for DELETE: ${operation}` }, { status: 400 });
    }
    // Validate all records have Id or id
    const missingId = records.find((r: any) => !r.Id && !r.id);
    if (missingId) {
      return NextResponse.json({ error: 'All records must include an Id or id field for delete operations.' }, { status: 400 });
    }
    const results = await client.batch('delete', sobjectType, records);
    return NextResponse.json({ success: true, operation: 'delete', results });
  } catch (error) {
    console.error('Error in Salesforce batch delete:', error);
    return NextResponse.json({ error: 'Failed to perform Salesforce batch delete', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
