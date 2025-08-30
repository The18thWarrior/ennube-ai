// === route.ts ===
// Created: 2025-08-29 11:25
// Purpose: API routes for individual customer profile operations
// Exports: GET, PUT, DELETE handlers
// Interactions: Used for customer profile details, updates, and deletions
// Notes: Handles single customer profile operations with proper validation

import { NextRequest, NextResponse } from 'next/server'
import { customerProfileService } from '@/lib/database'
import { getErrorMessage } from '@/lib/utils'
import type { CreateCustomerProfileData } from '@/lib/types'

// GET /api/customer-profiles/[id] - Get single customer profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params;
    const id = _params.id
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID',
          message: 'Customer profile ID must be provided'
        },
        { status: 400 }
      )
    }

    const customerProfile = await customerProfileService.getById(id)
    
    if (!customerProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Customer profile not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: customerProfile
    })
  } catch (error) {
    console.error('Error fetching customer profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        message: 'Failed to fetch customer profile'
      },
      { status: 500 }
    )
  }
}

// PUT /api/customer-profiles/[id] - Update customer profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params;
    const id = _params.id

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID',
          message: 'Customer profile ID must be provided'
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    const updateData: Partial<CreateCustomerProfileData> = {}
    if (body.customer_profile_name !== undefined) updateData.customer_profile_name = body.customer_profile_name
    if (body.common_industries !== undefined) updateData.common_industries = body.common_industries
    if (body.frequently_purchased_products !== undefined) updateData.frequently_purchased_products = body.frequently_purchased_products
    if (body.geographic_regions !== undefined) updateData.geographic_regions = body.geographic_regions
    if (body.active !== undefined) updateData.active = body.active

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data provided',
          message: 'At least one field must be provided for update'
        },
        { status: 400 }
      )
    }

    const customerProfile = await customerProfileService.update(id, updateData)
    
    if (!customerProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Customer profile not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: customerProfile,
      message: 'Customer profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating customer profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        message: 'Failed to update customer profile'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/customer-profiles/[id] - Delete customer profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params;
    const id = _params.id

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID',
          message: 'Customer profile ID must be provided'
        },
        { status: 400 }
      )
    }

    const deleted = await customerProfileService.delete(id)
    
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Customer profile not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Customer profile deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting customer profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        message: 'Failed to delete customer profile'
      },
      { status: 500 }
    )
  }
}

/*
 * === route.ts ===
 * Updated: 2025-08-29 11:25
 */
