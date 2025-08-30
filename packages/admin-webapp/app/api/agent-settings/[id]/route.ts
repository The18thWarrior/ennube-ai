// === route.ts ===
// Created: 2025-08-29 11:06
// Purpose: API routes for single agent setting operations
// Exports: GET, PUT, DELETE handlers

import { NextRequest, NextResponse } from 'next/server'
import { agentSettingsService } from '@/lib/database'
import { getErrorMessage } from '@/lib/utils'
import type { CreateAgentSettingsData } from '@/lib/types'

// GET /api/agent-settings/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _params = await params
    const id = _params.id

    const record = await agentSettingsService.getById(id)
    if (!record) return NextResponse.json({ success: false, error: 'Not found', message: 'Agent setting not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('Error fetching agent setting:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to fetch agent setting' }, { status: 500 })
  }
}

// PUT /api/agent-settings/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _params = await params
    const id = _params.id

    const body = await request.json()
    const updateData: Partial<CreateAgentSettingsData> = {}
    if (body.agent !== undefined) updateData.agent = body.agent
    if (body.batch_size !== undefined) updateData.batch_size = Number(body.batch_size)
    if (body.active !== undefined) updateData.active = Boolean(body.active)
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.provider !== undefined) updateData.provider = body.provider

    if (Object.keys(updateData).length === 0) return NextResponse.json({ success: false, error: 'No data provided', message: 'At least one field must be provided for update' }, { status: 400 })

    const updated = await agentSettingsService.update(id, updateData)
    if (!updated) return NextResponse.json({ success: false, error: 'Not found', message: 'Agent setting not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: updated, message: 'Agent setting updated successfully' })
  } catch (error) {
    console.error('Error updating agent setting:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to update agent setting' }, { status: 500 })
  }
}

// DELETE /api/agent-settings/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _params = await params
    const id = _params.id

    const deleted = await agentSettingsService.delete(id)
    if (!deleted) return NextResponse.json({ success: false, error: 'Not found', message: 'Agent setting not found' }, { status: 404 })

    return NextResponse.json({ success: true, message: 'Agent setting deleted successfully' })
  } catch (error) {
    console.error('Error deleting agent setting:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to delete agent setting' }, { status: 500 })
  }
}

/*
 * === route.ts ===
 * Updated: 2025-08-29 11:06
 */
