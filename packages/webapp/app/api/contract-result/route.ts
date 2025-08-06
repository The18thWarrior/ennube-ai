// === route.ts ===
// Created: 2025-07-29
// Purpose: Next.js API route for CRUD operations on contract results
// Exports:
//   - default (Next.js API handler)
// Interactions:
//   - Uses: lib/db/contract-results-storage
// Notes:
//   - Follows RESTful conventions, validates input, structured error responses

import { NextRequest, NextResponse } from 'next/server';
import {
  getContractResultById,
  getContractResultBySourceId,
  listContractResultsByUser,
  createContractResult,
  updateContractResult,
  deleteContractResult,
  ProviderEnum,
  ContractResultSchema
} from '@/lib/db/contract-results-storage';
import { validateSession } from '@/lib/n8n/utils';

/**
 * OVERVIEW
 *
 * - Purpose: Exposes RESTful API for contract_results CRUD operations.
 * - Assumptions: Auth handled upstream; userId from session.
 * - Edge Cases: Missing/invalid data, DB errors, unsupported methods.
 * - How it fits: Enables frontend/backend integration for contract result management.
 * - Future Improvements: Add pagination, filtering, authentication middleware.
 */

export async function GET(req: NextRequest) {
  try {
    const { isValid, userId } = await validateSession(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const source_id = searchParams.get('source_id');
    if (id !== null) {
      if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      const result = await getContractResultById(String(id), String(userId));
      if (!result) return NextResponse.json({ error: 'Contract result not found' }, { status: 404 });
      return NextResponse.json(result);
    }
    if (source_id !== null) {
      if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      const result = await getContractResultBySourceId(String(source_id), String(userId));
      if (!result) return NextResponse.json({ error: 'Contract result not found' }, { status: 404 });
      return NextResponse.json(result);
    }
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    // List all for user
    const results = await listContractResultsByUser(String(userId));
    return NextResponse.json(results);
  } catch (error) {
    console.log('GET /contract-result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isValid, userId } = await validateSession(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    const body = await req.json();
    // Validate required fields
    if (!body.source_id || !body.provider || !body.contract_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Validate provider and contract_data
    try {
      ProviderEnum.parse(body.provider);
      ContractResultSchema.parse(body.contract_data);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid provider or contract_data' }, { status: 400 });
    }
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    const input = {
      user_id: String(userId),
      updated_at: Date.now(),
      source_id: String(body.source_id),
      provider: body.provider,
      contract_data: body.contract_data
    };
    const result = await createContractResult(input);
    if (!result) return NextResponse.json({ error: 'Failed to create contract result' }, { status: 500 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.log('POST /contract-result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { isValid, userId } = await validateSession(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    const body = await req.json();
    const { id, ...patch } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    // Only allow updatable fields
    const allowed = ['updated_at', 'source_id', 'provider', 'contract_data'] as const;
    const filteredPatch: any = {};
    for (const key of allowed) {
      if (patch[key] !== undefined) {
        filteredPatch[key] = patch[key];
      }
    }
    if (filteredPatch.provider) {
      try { ProviderEnum.parse(filteredPatch.provider); } catch { return NextResponse.json({ error: 'Invalid provider' }, { status: 400 }); }
    }
    if (filteredPatch.contract_data) {
      try { ContractResultSchema.parse(filteredPatch.contract_data); } catch { return NextResponse.json({ error: 'Invalid contract_data' }, { status: 400 }); }
    }
    filteredPatch.updated_at = Date.now();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const result = await updateContractResult(String(id), String(userId), filteredPatch);
    if (!result) return NextResponse.json({ error: 'Failed to update contract result' }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.log('PUT /contract-result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { isValid, userId } = await validateSession(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const success = await deleteContractResult(String(id), String(userId));
    if (!success) return NextResponse.json({ error: 'Contract result not found or could not be deleted' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('DELETE /contract-result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/*
 * === route.ts ===
 * Updated: 2025-07-29
 * Summary: Next.js API route for contract_results CRUD operations
 * Key Components:
 *   - GET: Fetch single, by source_id, or all for user
 *   - POST: Create new contract result
 *   - PUT: Update contract result
 *   - DELETE: Remove contract result
 * Dependencies:
 *   - Requires: lib/db/contract-results-storage
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Input validation, error handling, structured responses
 */
