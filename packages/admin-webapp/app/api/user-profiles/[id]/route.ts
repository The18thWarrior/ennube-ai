// === route.ts ===
// Created: 2025-08-29 10:32
// Purpose: API routes for individual user profile operations
// Exports: GET, PUT, DELETE handlers
// Interactions: Used for user profile details, updates, and deletions
// Notes: Handles single user profile operations with proper validation

import { NextRequest, NextResponse } from 'next/server'
import { userProfileService } from '#/lib/database'
import { getErrorMessage } from '#/lib/utils'
import type { CreateUserProfileData } from '#/lib/types'

// GET /api/user-profiles/[id] - Get single user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params;
    const id = parseInt(_params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID',
          message: 'User profile ID must be a number'
        },
        { status: 400 }
      )
    }

    const userProfile = await userProfileService.getById(id)
    
    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'User profile not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: userProfile
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        message: 'Failed to fetch user profile'
      },
      { status: 500 }
    )
  }
}

// PUT /api/user-profiles/[id] - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params;
    const id = parseInt(_params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID',
          message: 'User profile ID must be a number'
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Filter out undefined values and validate
    const updateData: Partial<CreateUserProfileData> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.company !== undefined) updateData.company = body.company
    if (body.job_role !== undefined) updateData.job_role = body.job_role

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

    const userProfile = await userProfileService.update(id, updateData)
    
    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'User profile not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: userProfile,
      message: 'User profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists',
          message: 'A user with this email address already exists'
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        message: 'Failed to update user profile'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/user-profiles/[id] - Delete user profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _params = await params;
    const id = parseInt(_params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID',
          message: 'User profile ID must be a number'
        },
        { status: 400 }
      )
    }

    const deleted = await userProfileService.delete(id)
    
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'User profile not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'User profile deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        message: 'Failed to delete user profile'
      },
      { status: 500 }
    )
  }
}

/*
 * === route.ts ===
 * Updated: 2025-08-29 10:32
 * Summary: Individual user profile API endpoints
 * Key Components:
 *   - GET: Fetch single user profile by ID
 *   - PUT: Update user profile with validation
 *   - DELETE: Delete user profile with confirmation
 * Dependencies:
 *   - Requires: database service, types, utils
 * Version History:
 *   v1.0 – initial single record endpoints
 * Notes:
 *   - Includes proper ID validation and error handling
 *   - Handles constraint violations gracefully
 */
