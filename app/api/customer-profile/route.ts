// === route.ts ===
// Created: 2025-07-24 15:00
// Purpose: Next.js API route for CRUD operations on customer profiles
// Exports:
//   - default (Next.js API handler)
// Interactions:
//   - Uses: lib/db/customer-profile-storage
// Notes:
//   - Follows RESTful conventions, validates input, structured error responses

import { NextRequest, NextResponse } from 'next/server';
import {
  saveCustomerProfile,
  getCustomerProfile,
  getUserCustomerProfiles,
  updateCustomerProfile,
  deleteCustomerProfile,
  CustomerProfile
} from '@/lib/db/customer-profile-storage';
import { auth } from '@/auth';
import { validateSession } from '@/lib/n8n/utils';

/**
 * OVERVIEW
 *
 * - Purpose: Exposes RESTful API for customer profile CRUD operations.
 * - Assumptions: Auth handled upstream; userId from request body or query.
 * - Edge Cases: Missing/invalid data, DB errors, unsupported methods.
 * - How it fits: Enables frontend/backend integration for customer profile management.
 * - Future Improvements: Add pagination, filtering, authentication middleware.
 */

export async function GET(req: NextRequest) {
  try {

    const {isValid, userId} = await validateSession(req);
    if (!isValid) {
      console.log('GET /customer-profile - Invalid session');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    //const userId = session?.user?.auth0?.sub || searchParams.get('subId'); // Use authenticated user's ID
    if (id) {
      const profile = await getCustomerProfile(id);

      console.log('GET /customer-profile - Profile fetched:', profile);
      if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      return NextResponse.json(profile);
    }
    if (userId) {
      
      const profiles = await getUserCustomerProfiles(userId);
      console.log('GET /customer-profile - Profiles fetched:', profiles.length);
      return NextResponse.json(profiles);
    }
    console.log('GET /customer-profile - ' + 'Missing id or userId');
    return NextResponse.json({ error: 'Missing id or userId' }, { status: 400 });
  } catch (error) {
    console.error('GET /customer-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {isValid, userId} = await validateSession(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const body = await req.json();
    // Validate required fields
    if (!body.customerProfileName) {
      return NextResponse.json({ error: 'Missing userId or customerProfileName' }, { status: 400 });
    }
    // Sanitize input (basic)
    const profile: Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: String(userId),
      customerProfileName: String(body.customerProfileName),
      commonIndustries: String(body.commonIndustries || ''),
      frequentlyPurchasedProducts: String(body.frequentlyPurchasedProducts || ''),
      geographicRegions: String(body.geographicRegions || ''),
      averageDaysToClose: Number(body.averageDaysToClose || 0),
      socialMediaPresence: body.socialMediaPresence ? String(body.socialMediaPresence) : undefined,
      channelRecommendation: body.channelRecommendation ? String(body.channelRecommendation) : undefined,
      accountStrategy: body.accountStrategy ? String(body.accountStrategy) : undefined,
      accountEmployeeSize: body.accountEmployeeSize ? String(body.accountEmployeeSize) : undefined,
      accountLifecycle: body.accountLifecycle ? String(body.accountLifecycle) : undefined,
      active: typeof body.active === 'boolean' ? body.active : true
    };
    const id = await saveCustomerProfile(profile);
    if (!id) return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /customer-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const {isValid, userId} = await validateSession(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    // Only allow updatable fields
    const allowed = [
      'customerProfileName', 'commonIndustries', 'frequentlyPurchasedProducts', 'geographicRegions',
      'averageDaysToClose', 'socialMediaPresence', 'channelRecommendation', 'accountStrategy',
      'accountEmployeeSize', 'accountLifecycle', 'active'
    ] as const;
    const filteredUpdates: Partial<Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt'>> = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key as keyof typeof updates];
      }
    }
    const success = await updateCustomerProfile(id, filteredUpdates);
    if (!success) return NextResponse.json({ error: 'Failed to update profile' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /customer-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const {isValid, userId} = await validateSession(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const success = await deleteCustomerProfile(id);
    if (!success) return NextResponse.json({ error: 'Profile not found or could not be deleted' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /customer-profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/*
 * === route.ts ===
 * Updated: 2025-07-24 15:00
 * Summary: Next.js API route for customer profile CRUD operations
 * Key Components:
 *   - GET: Fetch single or multiple profiles
 *   - POST: Create new profile
 *   - PUT: Update profile
 *   - DELETE: Remove profile
 * Dependencies:
 *   - Requires: lib/db/customer-profile-storage
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Input validation, error handling, structured responses
 */
