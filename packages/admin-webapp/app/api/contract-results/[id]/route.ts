import { NextRequest, NextResponse } from 'next/server'
import { contractResultService } from '#/lib/database'
import { getErrorMessage } from '#/lib/utils'
import type { CreateContractResultData } from '#/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params
    const id = _params.id
    if (!id) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })

    const item = await contractResultService.getById(id)
    if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Error fetching contract result:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to fetch contract result' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params
    const id = _params.id
    if (!id) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })

    const body = await request.json()
    const updateData: Partial<CreateContractResultData> = {}
    if (body.user_id !== undefined) updateData.user_id = body.user_id
    if (body.source_id !== undefined) updateData.source_id = body.source_id
    if (body.provider !== undefined) updateData.provider = body.provider
    if (body.contract_data !== undefined) updateData.contract_data = body.contract_data

    if (Object.keys(updateData).length === 0) return NextResponse.json({ success: false, error: 'No data provided' }, { status: 400 })

    const updated = await contractResultService.update(id, updateData)
    if (!updated) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: updated, message: 'Contract result updated' })
  } catch (error) {
    console.error('Error updating contract result:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to update contract result' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params
    const id = _params.id
    if (!id) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })

    const deleted = await contractResultService.delete(id)
    if (!deleted) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, message: 'Contract result deleted' })
  } catch (error) {
    console.error('Error deleting contract result:', error)
    return NextResponse.json({ success: false, error: getErrorMessage(error), message: 'Failed to delete contract result' }, { status: 500 })
  }
}
