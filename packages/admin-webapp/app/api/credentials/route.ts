// === route.ts ===
// Created: 2025-08-29 11:15
// Purpose: API routes for credentials list and create

import { NextRequest, NextResponse } from 'next/server'
import { credentialService } from '@/lib/database'
import { getErrorMessage } from '@/lib/utils'
import type { CreateCredentialData, PaginationParams } from '@/lib/types'

// GET /api/credentials - List credentials with pagination
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

    const result = await credentialService.getAll(params)
    return NextResponse.json({ success: true, data: result.data, pagination: result.pagination })
  } catch (error) {
    console.error('Error fetching credentials:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to fetch credentials' }, { status: 500 })
  }
}

// POST /api/credentials - Create credential
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.user_id || !body.type || !body.access_token || !body.instance_url || !body.expires_at) {
      return NextResponse.json({ success: false, error: 'Missing required fields', message: 'user_id, type, access_token, instance_url, expires_at are required' }, { status: 400 })
    }

    const data: CreateCredentialData = {
      user_id: body.user_id,
      type: body.type,
      access_token: body.access_token,
      instance_url: body.instance_url,
      refresh_token: body.refresh_token,
      user_info_id: body.user_info_id,
      user_info_organization_id: body.user_info_organization_id,
      user_info_display_name: body.user_info_display_name,
      user_info_email: body.user_info_email,
      user_info_organization_id_alt: body.user_info_organization_id_alt,
      account_timestamp_field: body.account_timestamp_field,
      expires_at: body.expires_at
    }

    const credential = await credentialService.create(data)
    return NextResponse.json({ success: true, data: credential, message: 'Credential created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating credential:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to create credential' }, { status: 500 })
  }
}
