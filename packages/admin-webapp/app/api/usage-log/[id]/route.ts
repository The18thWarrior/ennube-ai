// === route.ts ===
// Created: 2025-08-29 11:23
// Purpose: API routes for single usage_log record operations
// Exports: GET, PUT, DELETE handlers

import { NextRequest, NextResponse } from 'next/server'
import { usageLogService } from '@/lib/database'
import { getErrorMessage } from '@/lib/utils'
import type { CreateUsageLogData } from '@/lib/types'

// GET /api/usage-log/[id] - Get single usage log
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params
    const id = _params.id

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid ID', message: 'ID is required' }, { status: 400 })
    }

    const item = await usageLogService.getById(id)

    if (!item) {
      return NextResponse.json({ success: false, error: 'Not found', message: 'Usage log not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Error fetching usage log item:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to fetch usage log item' }, { status: 500 })
  }
}

// PUT /api/usage-log/[id] - Update usage log
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params
    const id = _params.id

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid ID', message: 'ID is required' }, { status: 400 })
    }

    const body = await request.json()

    const updateData: Partial<CreateUsageLogData> = {}
    if (body.timestamp !== undefined) updateData.timestamp = body.timestamp
    if (body.records_updated !== undefined) updateData.records_updated = body.records_updated
    if (body.records_created !== undefined) updateData.records_created = body.records_created
    if (body.meetings_booked !== undefined) updateData.meetings_booked = body.meetings_booked
    if (body.queries_executed !== undefined) updateData.queries_executed = body.queries_executed
    if (body.usage !== undefined) updateData.usage = body.usage
    if (body.status !== undefined) updateData.status = body.status
    if (body.archived !== undefined) updateData.archived = body.archived
    if (body.response_data !== undefined) updateData.response_data = body.response_data

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'No data provided', message: 'At least one field must be provided for update' }, { status: 400 })
    }

    const updated = await usageLogService.update(id, updateData)

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found', message: 'Usage log not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated, message: 'Usage log updated' })
  } catch (error) {
    console.error('Error updating usage log item:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to update usage log item' }, { status: 500 })
  }
}

// DELETE /api/usage-log/[id] - Delete usage log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params
    const id = _params.id

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invalid ID', message: 'ID is required' }, { status: 400 })
    }

    const deleted = await usageLogService.delete(id)

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Not found', message: 'Usage log not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Usage log deleted' })
  } catch (error) {
    console.error('Error deleting usage log item:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to delete usage log item' }, { status: 500 })
  }
}
