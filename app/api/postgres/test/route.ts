// === test/route.ts ===
// Created: 2025-07-21 10:15
// Purpose: API endpoint for testing PostgreSQL connections
// Exports:
//   - POST: Test connection with provided URL
//   - GET: Test stored connection for authenticated user
// Interactions:
//   - Used by: frontend connection setup, diagnostics
// Notes:
//   - Validates connection without storing credentials

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPostgresUrlBySub, parsePostgresConfigFromUrl } from '@/lib/db/postgres-storage';
import { connectToPostgres } from '@/lib/postgres';

/**
 * POST /api/postgres/test
 * Test a PostgreSQL connection without storing credentials
 * Body: { connectionUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { connectionUrl } = await request.json();
    
    if (!connectionUrl || typeof connectionUrl !== 'string') {
      return NextResponse.json(
        { error: 'Valid connectionUrl is required' },
        { status: 400 }
      );
    }

    // Parse connection config
    let config;
    try {
      config = parsePostgresConfigFromUrl(connectionUrl);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid PostgreSQL connection URL format',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 400 }
      );
    }

    // Test the connection
    const client = connectToPostgres(config);
    
    try {
      // Simple query to test connection
      const result = await client.query('SELECT 1 as test, NOW() as current_time');
      
      return NextResponse.json({
        success: true,
        message: 'Connection successful',
        serverTime: result.rows[0]?.current_time,
        host: config.host,
        database: config.database
      });
    } finally {
      await client.close();
    }
    
  } catch (error) {
    console.error('Error testing PostgreSQL connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Connection failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/postgres/test
 * Test stored PostgreSQL connection for authenticated user
 * Query parameters:
 * - sub: Auth0 user sub (optional, uses current session if not provided)
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const _sub = searchParams.get('sub');

    // Get user session
    const session = await auth();
    const sub = _sub || session?.user?.auth0?.sub;
    
    if (!sub) {
      return NextResponse.json(
        { error: 'Missing required parameter: sub or valid session' },
        { status: 400 }
      );
    }
    
    // Get PostgreSQL credentials for the user
    const urlData = await getPostgresUrlBySub(sub);
    
    if (!urlData) {
      return NextResponse.json(
        { error: 'No PostgreSQL credentials found for this user' },
        { status: 404 }
      );
    }
    
    // Parse connection config from stored URL
    let config;
    try {
      config = parsePostgresConfigFromUrl(urlData.instanceUrl);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid PostgreSQL connection URL stored',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
    
    // Test the connection
    const client = connectToPostgres(config);
    
    try {
      // Simple query to test connection
      const result = await client.query('SELECT 1 as test, NOW() as current_time, version() as version');
      
      return NextResponse.json({
        success: true,
        message: 'Connection successful',
        serverTime: result.rows[0]?.current_time,
        version: result.rows[0]?.version,
        host: config.host,
        database: config.database,
        storedAt: urlData.createdAt,
        expiresAt: urlData.expiresAt
      });
    } finally {
      await client.close();
    }
    
  } catch (error) {
    console.error('Error testing stored PostgreSQL connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/*
 * === test/route.ts ===
 * Updated: 2025-07-21 10:15
 * Summary: API endpoint for testing PostgreSQL connections
 * Key Components:
 *   - POST: Test connection with provided URL
 *   - GET: Test stored connection
 * Dependencies:
 *   - Requires: auth, postgres-storage, postgres client
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Safe connection testing without credential storage
 */
