// === route.ts ===
// Created: 2025-08-29 10:30
// Purpose: API routes for user profiles CRUD operations
// Exports: GET, POST handlers
// Interactions: Used by user profile admin pages
// Notes: Implements full CRUD with validation and error handling

import { NextRequest, NextResponse } from 'next/server'
import { userProfileService } from '@/lib/database'
import { getErrorMessage } from '@/lib/utils'
import type { CreateUserProfileData, PaginationParams } from '@/lib/types'

/**
 * OVERVIEW
 *
 * - Purpose: API endpoints for user profile management
 * - Assumptions: PostgreSQL database, proper error handling
 * - Edge Cases: Database connection failures, invalid data
 * - How it fits: Backend API for admin interface
 * - Future Improvements: Add authentication, rate limiting
 */

// GET /api/user-profiles - List user profiles with pagination
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

    const result = await userProfileService.getAll(params)
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching user profiles:', error)
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        message: 'Failed to fetch user profiles'
      },
      { status: 500 }
    )
  }
}

// POST /api/user-profiles - Create new user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Basic validation
    if (!body.name || !body.email || !body.company || !body.job_role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Name, email, company, and job_role are required'
        },
        { status: 400 }
      )
    }

    const data: CreateUserProfileData = {
      name: body.name,
      email: body.email,
      company: body.company,
      job_role: body.job_role
    }

    const userProfile = await userProfileService.create(data)
    
    return NextResponse.json({
      success: true,
      data: userProfile,
      message: 'User profile created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user profile:', error)
    
    // Handle unique constraint violation (duplicate email)
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
        message: 'Failed to create user profile'
      },
      { status: 500 }
    )
  }
}

/*
 * === route.ts ===
 * Updated: 2025-08-29 10:30
 * Summary: User profiles API endpoints with CRUD operations
 * Key Components:
 *   - GET: List user profiles with pagination and search
 *   - POST: Create new user profile with validation
 * Dependencies:
 *   - Requires: database service, types, utils
 * Version History:
 *   v1.0 – initial CRUD endpoints
 * Notes:
 *   - Includes comprehensive error handling
 *   - Validates required fields and constraints
 */
