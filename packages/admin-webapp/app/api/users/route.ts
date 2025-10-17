// === route.ts ===
// Created: 2025-08-30 12:30
// Purpose: API route to list Auth0 users using the admin-webapp auth0 client
// Exports: GET

import { auth0Client } from '../../../lib/auth0';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users
 * Query params supported: page, perPage, q, includeTotals
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    const perPage = Number(url.searchParams.get('perPage') ?? url.searchParams.get('per_page') ?? '50');
    const q = url.searchParams.get('q') ?? undefined;
    const includeTotals = (url.searchParams.get('includeTotals') ?? url.searchParams.get('include_totals') ?? 'false') === 'true';

    const params = await Promise.resolve({ page, perPage, q, includeTotals });

    const result = await auth0Client.listUsers(params);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const body = { error: err?.message ?? 'Unknown error', details: err?.details ?? null };
    return NextResponse.json(body, { status: err?.status ?? 500 });
  }
}

/**
 * POST: Create a new secondary user
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    const { email, password, firstName, lastName, role } = body;
    console.log(body);
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({
        error: 'Missing required fields: email, password, firstName, lastName'
      }, { status: 400 });
    }

    // Create user params
    const userParams = {
      email,
      password,
      firstName,
      lastName,
      role,
      metadata: body.metadata ?? {}
    };

    // Create the user
    const newUser = await auth0Client.createUser(userParams);

    return NextResponse.json({
      success: true,
      user: newUser
    }, { status: 201 });
  } catch (error: any) {
    console.log('Error creating secondary user:', error);
    return NextResponse.json({ 
      error: 'Failed to create secondary user',
      details: error.message 
    }, { status: 500 });
  }
}