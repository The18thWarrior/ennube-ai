// === query/route.ts ===
// Created: 2025-07-21 10:15
// Purpose: API endpoint for executing PostgreSQL queries
// Exports:
//   - GET: Execute SQL query with parameters
//   - POST: Execute SQL query with parameters (for complex queries)
// Interactions:
//   - Used by: frontend components, data visualization
// Notes:
//   - Requires stored PostgreSQL credentials

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPostgresUrlBySub, parsePostgresConfigFromUrl } from '@/lib/db/postgres-storage';
import { connectToPostgres } from '@/lib/postgres';

/**
 * GET /api/postgres/query
 * Execute a PostgreSQL query
 * Query parameters:
 * - sub: Auth0 user sub (optional, uses current session if not provided)
 * - sql: The SQL query string to execute
 * - params: JSON string of query parameters (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const _sub = searchParams.get('sub');
    const sql = searchParams.get('sql');
    const paramsStr = searchParams.get('params');

    // Get user session
    const session = await auth();
    const sub = _sub || session?.user.sub;
    
    // Validate required parameters
    if (!sub) {
      return NextResponse.json(
        { error: 'Missing required parameter: sub or valid session' },
        { status: 400 }
      );
    }
    
    if (!sql) {
      return NextResponse.json(
        { error: 'Missing required parameter: sql' },
        { status: 400 }
      );
    }
    
    // Parse query parameters if provided
    let params: unknown[] = [];
    if (paramsStr) {
      try {
        params = JSON.parse(paramsStr);
        if (!Array.isArray(params)) {
          throw new Error('Params must be an array');
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid params format. Must be a JSON array.' },
          { status: 400 }
        );
      }
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
      console.log('Error parsing PostgreSQL config:', error);
      return NextResponse.json(
        { error: 'Invalid PostgreSQL connection URL stored' },
        { status: 500 }
      );
    }
    
    // Create PostgreSQL client and execute query
    const client = connectToPostgres(config);
    
    try {
      const queryResult = await client.query(sql, params);
      
      // Return the query results
      return NextResponse.json({
        success: true,
        data: queryResult.rows,
        rowCount: queryResult.rowCount,
        fields: queryResult.fields?.map(field => ({
          name: field.name,
          dataTypeID: field.dataTypeID
        }))
      });
    } finally {
      await client.close();
    }
    
  } catch (error) {
    console.log('Error executing PostgreSQL query:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute PostgreSQL query',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/postgres/query
 * Execute a PostgreSQL query with request body
 * Body: { sql: string, params?: unknown[], sub?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { sql, params = [], sub: _sub } = await request.json();
    
    // Get user session
    const session = await auth();
    const sub = _sub || session?.user.sub;
    
    // Validate required parameters
    if (!sub) {
      return NextResponse.json(
        { error: 'Missing required parameter: sub or valid session' },
        { status: 400 }
      );
    }
    
    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid required parameter: sql' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(params)) {
      return NextResponse.json(
        { error: 'Params must be an array' },
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
        { error: 'Invalid PostgreSQL connection URL stored' },
        { status: 500 }
      );
    }
    
    // Create PostgreSQL client and execute query
    const client = connectToPostgres(config);
    
    try {
      const queryResult = await client.query(sql, params);
      
      // Return the query results
      return NextResponse.json({
        success: true,
        data: queryResult.rows,
        rowCount: queryResult.rowCount,
        fields: queryResult.fields?.map(field => ({
          name: field.name,
          dataTypeID: field.dataTypeID
        }))
      });
    } finally {
      await client.close();
    }
    
  } catch (error) {
    console.log('Error executing PostgreSQL query:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute PostgreSQL query',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/*
 * === query/route.ts ===
 * Updated: 2025-07-21 10:15
 * Summary: API endpoints for PostgreSQL query execution
 * Key Components:
 *   - GET: Execute query via URL params
 *   - POST: Execute query via request body
 * Dependencies:
 *   - Requires: auth, postgres-storage, postgres client
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Supports parameterized queries for security
 */
