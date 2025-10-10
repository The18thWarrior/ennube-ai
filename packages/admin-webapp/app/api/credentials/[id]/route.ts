// === route.ts ===
// Created: 2025-08-29 11:17
// Purpose: API routes for individual credential operations

import { NextRequest, NextResponse } from 'next/server'
import { credentialService } from '#/lib/database'
import { getErrorMessage } from '#/lib/utils'
import type { CreateCredentialData } from '#/lib/types'

// GET /api/credentials/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _params = await params
    const id = _params.id
    if (!id) return NextResponse.json({ success: false, error: 'Invalid ID', message: 'Credential ID is required' }, { status: 400 })

    const credential = await credentialService.getById(id)
    if (!credential) return NextResponse.json({ success: false, error: 'Not found', message: 'Credential not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: credential })
  } catch (error) {
    console.error('Error fetching credential:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to fetch credential' }, { status: 500 })
  }
}

// PUT /api/credentials/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _params = await params
    const id = _params.id
    if (!id) return NextResponse.json({ success: false, error: 'Invalid ID', message: 'Credential ID is required' }, { status: 400 })

    const body = await request.json()
    const updateData: Partial<CreateCredentialData> = {}
    if (body.user_id !== undefined) updateData.user_id = body.user_id
    if (body.type !== undefined) updateData.type = body.type
    if (body.access_token !== undefined) updateData.access_token = body.access_token
    if (body.instance_url !== undefined) updateData.instance_url = body.instance_url
    if (body.refresh_token !== undefined) updateData.refresh_token = body.refresh_token
    if (body.user_info_id !== undefined) updateData.user_info_id = body.user_info_id
    if (body.user_info_organization_id !== undefined) updateData.user_info_organization_id = body.user_info_organization_id
    if (body.user_info_display_name !== undefined) updateData.user_info_display_name = body.user_info_display_name
    if (body.user_info_email !== undefined) updateData.user_info_email = body.user_info_email
    if (body.user_info_organization_id_alt !== undefined) updateData.user_info_organization_id_alt = body.user_info_organization_id_alt
    if (body.account_timestamp_field !== undefined) updateData.account_timestamp_field = body.account_timestamp_field
    if (body.expires_at !== undefined) updateData.expires_at = body.expires_at

    if (Object.keys(updateData).length === 0) return NextResponse.json({ success: false, error: 'No data provided', message: 'At least one field must be provided for update' }, { status: 400 })

    const credential = await credentialService.update(id, updateData)
    if (!credential) return NextResponse.json({ success: false, error: 'Not found', message: 'Credential not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: credential, message: 'Credential updated successfully' })
  } catch (error) {
    console.error('Error updating credential:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to update credential' }, { status: 500 })
  }
}

// DELETE /api/credentials/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _params = await params
    const id = _params.id
    if (!id) return NextResponse.json({ success: false, error: 'Invalid ID', message: 'Credential ID is required' }, { status: 400 })

    const deleted = await credentialService.delete(id)
    if (!deleted) return NextResponse.json({ success: false, error: 'Not found', message: 'Credential not found' }, { status: 404 })

    return NextResponse.json({ success: true, message: 'Credential deleted successfully' })
  } catch (error) {
    console.error('Error deleting credential:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to delete credential' }, { status: 500 })
  }
}
