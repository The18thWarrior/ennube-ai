import { NextRequest, NextResponse } from 'next/server';
import { getHubSpotCredentialsBySub } from '@/lib/db/hubspot-storage';
import { createHubSpotClient, HubSpotClient } from '@/lib/hubspot';
import { HubSpotAuthResult } from '@/lib/types';

/**
 * Helper function to get a HubSpot client from the sub parameter
 */
async function getHubSpotClientFromSub(request: NextRequest): Promise<{ 
  client: HubSpotClient | null, 
  error: NextResponse | null,
  objectType: string | null 
}> {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const sub = searchParams.get('sub');
  const objectType = searchParams.get('objectType');
  
  // Validate required parameters
  if (!sub) {
    return {
      client: null,
      error: NextResponse.json(
        { error: 'Missing required parameter: sub' },
        { status: 400 }
      ),
      objectType: null
    };
  }
  
  if (!objectType) {
    return {
      client: null,
      error: NextResponse.json(
        { error: 'Missing required parameter: objectType' },
        { status: 400 }
      ),
      objectType: null
    };
  }
  
  // Get stored credentials
  const credentials = await getHubSpotCredentialsBySub(sub);
  
  if (!credentials) {
    return {
      client: null,
      error: NextResponse.json(
        { error: 'No HubSpot credentials found for this user' },
        { status: 404 }
      ),
      objectType: null
    };
  }
  
  // Create HubSpot client
  const authResult: HubSpotAuthResult = {
    success: true,
    accessToken: credentials.accessToken,
    refreshToken: credentials.refreshToken,
    expiresIn: credentials.expiresIn,
  };
  
  const client = createHubSpotClient(authResult);
  
  return { client, error: null, objectType };
}

/**
 * GET endpoint for retrieving a record by ID
 * Requires query parameters:
 * - sub: Auth0 user sub (ID)
 * - objectType: HubSpot object type (contacts, companies, deals, etc.)
 * - id: Record ID to retrieve
 * - properties: (Optional) Comma-separated list of properties to include
 */
export async function GET(request: NextRequest) {
  try {
    const { client, error, objectType } = await getHubSpotClientFromSub(request);
    
    if (error) return error;
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const propertiesParam = searchParams.get('properties');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    // Parse properties if provided
    const properties = propertiesParam ? propertiesParam.split(',') : undefined;
    
    // Retrieve the record
    const record = await client!.retrieve(objectType!, id, properties);
    
    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error retrieving HubSpot record:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for creating a new record
 * Requires query parameters:
 * - sub: Auth0 user sub (ID)
 * - objectType: HubSpot object type (contacts, companies, deals, etc.)
 * 
 * Request body: JSON object with the record properties
 */
export async function POST(request: NextRequest) {
  try {
    const { client, error, objectType } = await getHubSpotClientFromSub(request);
    
    if (error) return error;
    
    // Parse the request body
    const data = await request.json();
    
    // Create the record
    const id = await client!.create(objectType!, data);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating HubSpot record:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint for updating an existing record
 * Requires query parameters:
 * - sub: Auth0 user sub (ID)
 * - objectType: HubSpot object type (contacts, companies, deals, etc.)
 * - id: Record ID to update
 * 
 * Request body: JSON object with the updated properties
 */
export async function PUT(request: NextRequest) {
  try {
    const { client, error, objectType } = await getHubSpotClientFromSub(request);
    
    if (error) return error;
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const data = await request.json();
    
    // Update the record
    const success = await client!.update(objectType!, id, data);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error updating HubSpot record:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint for deleting a record
 * Requires query parameters:
 * - sub: Auth0 user sub (ID)
 * - objectType: HubSpot object type (contacts, companies, deals, etc.)
 * - id: Record ID to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { client, error, objectType } = await getHubSpotClientFromSub(request);
    
    if (error) return error;
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }
    
    // Delete the record
    const success = await client!.delete(objectType!, id);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting HubSpot record:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint for batch operations
 * Requires query parameters:
 * - sub: Auth0 user sub (ID)
 * - objectType: HubSpot object type (contacts, companies, deals, etc.)
 * - operation: Batch operation type (create, update, delete)
 * 
 * Request body: Array of records to process
 */
export async function PATCH(request: NextRequest) {
  try {
    const { client, error, objectType } = await getHubSpotClientFromSub(request);
    
    if (error) return error;
    
    const searchParams = request.nextUrl.searchParams;
    const operation = searchParams.get('operation');
    
    if (!operation || !['create', 'update', 'delete'].includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation parameter. Must be one of: create, update, delete' },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const records = await request.json();
    
    if (!Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Request body must be an array of records' },
        { status: 400 }
      );
    }
    
    // Execute the batch operation
    const results = await client!.batch(
      operation as 'create' | 'update' | 'delete',
      objectType!,
      records
    );
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error executing HubSpot batch operation:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
