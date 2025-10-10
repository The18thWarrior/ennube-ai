// === route.ts ===
// Created: 2025-08-29 11:22
// Purpose: API routes for usage_log list and creation
// Exports: GET, POST handlers

import { NextRequest, NextResponse } from 'next/server'
import { usageLogService } from '#/lib/database'
import { getErrorMessage } from '#/lib/utils'
import type { CreateUsageLogData, PaginationParams } from '#/lib/types'

// GET /api/usage-log - List usage log entries with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const params: PaginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    const result = await usageLogService.getAll(params)

    return NextResponse.json({ success: true, data: result.data, pagination: result.pagination })
  } catch (error) {
    console.error('Error fetching usage log:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to fetch usage log' }, { status: 500 })
  }
}

// POST /api/usage-log - Create a usage log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Basic validation
    if (!body.id || !body.timestamp || !body.user_sub || !body.agent || !body.signature || body.nonce === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields', message: 'id, timestamp, user_sub, agent, signature, and nonce are required' }, { status: 400 })
    }

    const data: CreateUsageLogData = {
      id: body.id,
      timestamp: body.timestamp,
      user_sub: body.user_sub,
      agent: body.agent,
      records_updated: body.records_updated || 0,
      records_created: body.records_created || 0,
      meetings_booked: body.meetings_booked || 0,
      queries_executed: body.queries_executed || 0,
      usage: body.usage || 0,
      signature: body.signature,
      nonce: body.nonce,
      status: body.status || null,
      archived: body.archived || false,
      response_data: body.response_data || null
    }

    const created = await usageLogService.create(data)

    return NextResponse.json({ success: true, data: created, message: 'Usage log created' }, { status: 201 })
  } catch (error) {
    console.error('Error creating usage log:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to create usage log' }, { status: 500 })
  }
}

