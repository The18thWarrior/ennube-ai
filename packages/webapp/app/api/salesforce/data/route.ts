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
 * POST: Create a new record in Salesforce
 * Required query parameters:
 * - sub: Auth0 user sub (ID) to retrieve credentials
 * - sobjectType: The Salesforce object type (e.g., 'Account', 'Contact')
 * Request body should contain the record data to create
 */
export async function POST(request: NextRequest) {
  try {
    const { client, error, sobjectType } = await getSalesforceClientFromSub(request);
    
    if (error) {
      return error;
    }
    
    if (!client || !sobjectType) {
      console.log('failed to initialize client:', sobjectType);
      return NextResponse.json(
        { error: 'Failed to initialize Salesforce client' },
        { status: 500 }
      );
    }
    
    // Parse the request body for the record data
    const data = await request.json();
    
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Request body is empty or invalid' },
        { status: 400 }
      );
    }
    
    // Create the record
    const recordId = await client.create(sobjectType, data);
    
    // Log the successful creation for billing
    const sub = request.nextUrl.searchParams.get('sub') as string;
    const agent = request.nextUrl.searchParams.get('agent') as string;
    //await logUsage(sub, agent, 'create', 1, 0, sobjectType);
    
    // Return the ID of the newly created record
    return NextResponse.json({ 
      success: true, 
      id: recordId,
      message: `Successfully created ${sobjectType} record`
    });
    
  } catch (error) {
    console.log('Error creating Salesforce record:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create Salesforce record',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update an existing record in Salesforce
 * Required query parameters:
 * - sub: Auth0 user sub (ID) to retrieve credentials
 * - sobjectType: The Salesforce object type (e.g., 'Account', 'Contact')
 * Request body should contain the record data to update including Id field
 */
export async function PUT(request: NextRequest) {
  try {
    const { client, error, sobjectType } = await getSalesforceClientFromSub(request);
    
    if (error) {
      console.log('Client:', client, error);
      return error;
    }
    
    if (!client || !sobjectType) {
      console.log('failed to initialize client:', sobjectType);
      return NextResponse.json(
        { error: 'Failed to initialize Salesforce client' },
        { status: 500 }
      );
    }
    
    // Parse the request body for the record data
    const data = await request.json();
    
    if (!data || Object.keys(data).length === 0) {
      console.log('Request body is empty or invalid:', data);
      return NextResponse.json(
        { error: 'Request body is empty or invalid' },
        { status: 400 }
      );
    }
    
    // Validate that the Id field is present
    if (!data.Id) {
      console.log('Record ID (Id field) is required for update operations:', data);
      return NextResponse.json(
        { error: 'Record ID (Id field) is required for update operations' },
        { status: 400 }
      );
    }
    
    // Update the record
    const success = await client.update(sobjectType, data);
    
    // Log the successful update for billing
    if (success) {
      console.log('Record updated successfully:', success);
      const sub = request.nextUrl.searchParams.get('sub') as string;
      const agent = request.nextUrl.searchParams.get('agent') as string;
      //await logUsage(sub, agent, 'update', 0, 1, sobjectType);
    }
    
    // Return success response
    return NextResponse.json({ 
      success, 
      id: data.Id,
      message: `Successfully updated ${sobjectType} record`
    });
    
  } catch (error) {
    console.log('Error updating Salesforce record:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update Salesforce record',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a record from Salesforce
 * Required query parameters:
 * - sub: Auth0 user sub (ID) to retrieve credentials
 * - sobjectType: The Salesforce object type (e.g., 'Account', 'Contact')
 * - id: The ID of the record to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { client, error, sobjectType } = await getSalesforceClientFromSub(request);
    
    if (error) {
      return error;
    }
    
    if (!client || !sobjectType) {
      return NextResponse.json(
        { error: 'Failed to initialize Salesforce client' },
        { status: 500 }
      );
    }
    
    // Get the record ID from query parameters
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    // Delete the record
    const success = await client.delete(sobjectType, id);
    
    // Log the successful deletion for billing
    if (success) {
      const sub = request.nextUrl.searchParams.get('sub') as string;
      const agent = request.nextUrl.searchParams.get('agent') as string;
      //await logUsage(sub, agent, 'delete', 0, 0, sobjectType);
    }
    
    // Return success response
    return NextResponse.json({ 
      success, 
      id,
      message: `Successfully deleted ${sobjectType} record`
    });
    
  } catch (error) {
    console.log('Error deleting Salesforce record:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete Salesforce record',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
