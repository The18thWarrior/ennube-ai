import { NextRequest, NextResponse } from 'next/server'
import { contractResultService } from '#/lib/database'
import { getErrorMessage } from '#/lib/utils'
import type { CreateContractResultData, PaginationParams } from '#/lib/types'

// GET /api/contract-results - list
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

    const result = await contractResultService.getAll(params)
    return NextResponse.json({ success: true, data: result.data, pagination: result.pagination })
  } catch (error) {
    console.error('Error fetching contract results:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to fetch contract results' }, { status: 500 })
  }
}

// POST /api/contract-results - create
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.user_id || !body.source_id || !body.provider) {
      return NextResponse.json({ success: false, error: 'Missing required fields', message: 'user_id, source_id and provider are required' }, { status: 400 })
    }

    const data: CreateContractResultData = {
      user_id: body.user_id,
      source_id: body.source_id,
      provider: body.provider,
      contract_data: body.contract_data || {}
    }

    const created = await contractResultService.create(data)
    return NextResponse.json({ success: true, data: created, message: 'Contract result created' }, { status: 201 })
  } catch (error) {
    console.error('Error creating contract result:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to create contract result' }, { status: 500 })
  }
}
