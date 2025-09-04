// === route.ts ===
// Created: 2025-08-29 11:00
// Purpose: API routes for customer profiles CRUD operations
// Exports: GET, POST handlers
// Interactions: Used by customer profile admin pages
// Notes: Implements full CRUD with user filtering

import { NextRequest, NextResponse } from 'next/server'
import { customerProfileService } from '#/lib/database'
import { getErrorMessage } from '#/lib/utils'
import type { CreateCustomerProfileData, PaginationParams } from '#/lib/types'

// Default user ID for demo purposes
const DEFAULT_USER_ID = 'user-293475nkk2n3y23n'

// GET /api/customer-profiles - List customer profiles with pagination
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

    const userId = searchParams.get('userId') || DEFAULT_USER_ID

    const result = await customerProfileService.getAll(params, userId)
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching customer profiles:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        message: 'Failed to fetch customer profiles'
      },
      { status: 500 }
    )
  }
}

// POST /api/customer-profiles - Create new customer profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Basic validation
    const requiredFields = [
      'customer_profile_name', 
      'common_industries', 
      'frequently_purchased_products', 
      'geographic_regions'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
            message: 'All required fields must be provided'
          },
          { status: 400 }
        )
      }
    }

    const data: CreateCustomerProfileData = {
      user_id: body.user_id || DEFAULT_USER_ID,
      active: body.active ?? true,
      customer_profile_name: body.customer_profile_name,
      common_industries: body.common_industries,
      frequently_purchased_products: body.frequently_purchased_products,
      geographic_regions: body.geographic_regions,
      average_days_to_close: body.average_days_to_close,
      social_media_presence: body.social_media_presence,
      channel_recommendation: body.channel_recommendation,
      account_strategy: body.account_strategy,
      account_employee_size: body.account_employee_size,
      account_lifecycle: body.account_lifecycle
    }

    const customerProfile = await customerProfileService.create(data)
    
    return NextResponse.json({
      success: true,
      data: customerProfile,
      message: 'Customer profile created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer profile:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        message: 'Failed to create customer profile'
      },
      { status: 500 }
    )
  }
}

/*
 * === route.ts ===
 * Updated: 2025-08-29 11:00
 * Summary: Customer profiles API endpoints with CRUD operations
 * Key Components:
 *   - GET: List customer profiles with user filtering
 *   - POST: Create new customer profile with validation
 * Dependencies:
 *   - Requires: database service, types, utils
 * Version History:
 *   v1.0 – initial CRUD endpoints with user filtering
 * Notes:
 *   - Uses default user ID for demo purposes
 *   - Validates required fields for customer profiles
 */
