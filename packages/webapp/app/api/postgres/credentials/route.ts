// === credentials/route.ts ===
// Created: 2025-07-21 10:15
// Purpose: API endpoint for managing PostgreSQL connection URLs/credentials
// Exports:
//   - GET: Retrieve user's stored PostgreSQL URL
//   - POST: Store/update PostgreSQL URL
//   - DELETE: Remove PostgreSQL URL
// Interactions:
//   - Used by: frontend components, hooks
// Notes:
//   - All operations require authentication

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
  getPostgresUrlById, 
  storePostgresUrl, 
  removePostgresUrl,
  parsePostgresConfigFromUrl 
} from '@/lib/db/postgres-storage';

/**
 * GET /api/postgres/credentials
 * Retrieves PostgreSQL connection URL for the authenticated user
 * 
 * Response:
 * - 200 OK: Returns sanitized credentials with hasCredentials=true
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: No credentials found for the user
 * - 500 Internal Server Error: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get credentials for the current user
    const urlData = await getPostgresUrlById();
    
    if (!urlData) {
      return NextResponse.json(
        { error: 'No PostgreSQL credentials found' },
        { status: 404 }
      );
    }

    // Check if credentials are expired
    const isExpired = Date.now() > urlData.expiresAt;
    
    // Parse config to validate URL without exposing sensitive data
    let configValid = false;
    try {
      parsePostgresConfigFromUrl(urlData.instanceUrl);
      configValid = true;
    } catch (error) {
      console.warn('Invalid PostgreSQL URL stored:', error);
    }

    // Return sanitized response
    const sanitizedResponse = {
      hasCredentials: true,
      isExpired,
      configValid,
      createdAt: urlData.createdAt,
      expiresAt: urlData.expiresAt,
      // Don't expose the actual connection string for security
      connectionUrl: configValid ? '[CONFIGURED]' : '[INVALID]'
    };
    
    return NextResponse.json(sanitizedResponse);
  } catch (error) {
    console.log('Error retrieving PostgreSQL credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/postgres/credentials
 * Stores/updates PostgreSQL connection URL for the authenticated user
 * 
 * Body: { connectionUrl: string }
 * 
 * Response:
 * - 200 OK: Credentials stored successfully
 * - 400 Bad Request: Invalid connection URL
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { connectionUrl } = await request.json();
    
    if (!connectionUrl || typeof connectionUrl !== 'string') {
      return NextResponse.json(
        { error: 'Valid connectionUrl is required' },
        { status: 400 }
      );
    }

    // Validate the connection URL by parsing it
    try {
      parsePostgresConfigFromUrl(connectionUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid PostgreSQL connection URL format' },
        { status: 400 }
      );
    }

    // Store the credentials
    const sessionId = await storePostgresUrl(connectionUrl);
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Failed to store PostgreSQL credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL credentials stored successfully',
      sessionId
    });
  } catch (error) {
    console.log('Error storing PostgreSQL credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/postgres/credentials
 * Removes PostgreSQL connection URL for the authenticated user
 * 
 * Response:
 * - 200 OK: Credentials removed successfully
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Server error
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Remove the credentials
    const success = await removePostgresUrl();
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove PostgreSQL credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL credentials removed successfully'
    });
  } catch (error) {
    console.log('Error removing PostgreSQL credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/*
 * === credentials/route.ts ===
 * Updated: 2025-07-21 10:15
 * Summary: API endpoints for PostgreSQL credential management
 * Key Components:
 *   - GET: Retrieve credentials status
 *   - POST: Store/update credentials
 *   - DELETE: Remove credentials
 * Dependencies:
 *   - Requires: auth, postgres-storage
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Connection strings never exposed in responses
 */
