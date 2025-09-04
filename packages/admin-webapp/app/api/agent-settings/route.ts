// === route.ts ===
// Created: 2025-08-29 11:05
// Purpose: API routes for agent settings CRUD operations
// Exports: GET, POST handlers
// Interactions: Used by agent settings admin pages

import { NextRequest, NextResponse } from 'next/server'
import { agentSettingsService } from '#/lib/database'
import { getErrorMessage } from '#/lib/utils'
import type { CreateAgentSettingsData, PaginationParams } from '#/lib/types'

// GET /api/agent-settings - List agent settings with pagination
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

    const result = await agentSettingsService.getAll(params)

    return NextResponse.json({ success: true, data: result.data, pagination: result.pagination })
  } catch (error) {
    console.error('Error fetching agent settings:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to fetch agent settings' }, { status: 500 })
  }
}

// POST /api/agent-settings - Create new agent setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.agent || body.batch_size === undefined || body.active === undefined || !body.frequency || !body.provider) {
      return NextResponse.json({ success: false, error: 'Missing required fields', message: 'agent, batch_size, active, frequency and provider are required' }, { status: 400 })
    }

    const data: CreateAgentSettingsData = {
      user_id: body.user_id || 'system',
      agent: body.agent,
      batch_size: Number(body.batch_size),
      active: Boolean(body.active),
      frequency: body.frequency,
      provider: body.provider
    }

    const created = await agentSettingsService.create(data)

    return NextResponse.json({ success: true, data: created, message: 'Agent setting created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating agent setting:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to create agent setting' }, { status: 500 })
  }
}

/*
 * === route.ts ===
 * Updated: 2025-08-29 11:05
 */
