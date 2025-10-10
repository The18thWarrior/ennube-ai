// === describe/route.ts ===
// Created: 2025-07-21 10:15
// Purpose: API endpoint for PostgreSQL database schema inspection
// Exports:
//   - GET: Describe database schema, tables, columns
// Interactions:
//   - Used by: frontend components, data exploration
// Notes:
//   - Provides database metadata and structure information

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPostgresUrlBySub, parsePostgresConfigFromUrl } from '@/lib/db/postgres-storage';
import { connectToPostgres } from '@/lib/postgres';

/**
 * GET /api/postgres/describe
 * Describe PostgreSQL database schema
 * Query parameters:
 * - sub: Auth0 user sub (optional, uses current session if not provided)
 * - table: Specific table name to describe (optional, returns all tables if not provided)
 * - schema: Schema name (optional, defaults to 'public')
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const _sub = searchParams.get('sub');
    const tableName = searchParams.get('table');
    const schemaName = searchParams.get('schema') || 'public';

    // Get user session
    const session = await auth();
    const sub = _sub || session?.user?.auth0?.sub;
    
    // Validate required parameters
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
        { error: 'Invalid PostgreSQL connection URL stored' },
        { status: 500 }
      );
    }
    
    // Create PostgreSQL client
    const client = connectToPostgres(config);
    
    try {
      if (tableName) {
        // Describe a specific table
        const columnsQuery = `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `;
        
        const indexesQuery = `
          SELECT 
            i.indexname,
            i.indexdef,
            i.indexname = (
              SELECT conname 
              FROM pg_constraint 
              WHERE conrelid = t.oid AND contype = 'p'
            ) as is_primary
          FROM pg_indexes i
          JOIN pg_class t ON t.relname = i.tablename
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = $1 AND i.tablename = $2
        `;
        
        const [columnsResult, indexesResult] = await Promise.all([
          client.query(columnsQuery, [schemaName, tableName]),
          client.query(indexesQuery, [schemaName, tableName])
        ]);
        
        return NextResponse.json({
          success: true,
          table: tableName,
          schema: schemaName,
          columns: columnsResult.rows,
          indexes: indexesResult.rows
        });
      } else {
        // Describe all tables in the schema
        const tablesQuery = `
          SELECT 
            table_name,
            table_type,
            table_schema
          FROM information_schema.tables 
          WHERE table_schema = $1
          ORDER BY table_name
        `;
        
        const schemasQuery = `
          SELECT schema_name
          FROM information_schema.schemata
          WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
          ORDER BY schema_name
        `;
        
        const [tablesResult, schemasResult] = await Promise.all([
          client.query(tablesQuery, [schemaName]),
          client.query(schemasQuery, [])
        ]);
        
        return NextResponse.json({
          success: true,
          schema: schemaName,
          tables: tablesResult.rows,
          schemas: schemasResult.rows.map(row => row.schema_name)
        });
      }
    } finally {
      await client.close();
    }
    
  } catch (error) {
    console.log('Error describing PostgreSQL database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to describe PostgreSQL database',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/*
 * === describe/route.ts ===
 * Updated: 2025-07-21 10:15
 * Summary: API endpoint for PostgreSQL schema inspection
 * Key Components:
 *   - GET: Describe tables, columns, indexes, schemas
 * Dependencies:
 *   - Requires: auth, postgres-storage, postgres client
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Uses information_schema for metadata queries
 */
