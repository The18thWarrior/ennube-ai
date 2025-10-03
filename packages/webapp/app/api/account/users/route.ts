/**
 * API routes for managing secondary users via Auth0
 * Implements REST pattern with:
 * - GET: List all secondary users
 * - POST: Create a new secondary user
 * - PATCH: Update an existing secondary user
 * - DELETE: Remove a secondary user
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { auth0Manager, CreateUserParams, UpdateUserParams } from '@/lib/auth0';
import { getCustomerSubscription } from '@/lib/stripe';


// Helper to verify the user is authorized to manage secondary users
async function verifyPrimaryUser(request: NextRequest) {
  
  try {
    // Get the current authenticated user
    const session = await auth();
    if (!session?.user?.auth0?.sub) {
      return { authorized: false, error: 'Authentication required', status: 401 };
    }

    const userSub = session.user.auth0.sub;
    // FOR LOCAL TESTING ONLY, SKIP SUBSCRIPTION CHECK
    //return { authorized: true, userSub };
    // Check if user has a valid subscription
    const subscription = await getCustomerSubscription(userSub);
    if (!subscription || subscription.status !== 'active') {
      return { authorized: false, error: 'Active subscription required', status: 403 };
    }

    // Only primary accounts should manage users (not secondary accounts themselves)
    // This is determined by checking if the user's subscription is directly from Stripe
    // rather than being licensed through another user
    if (!subscription.customer) {
      return { authorized: false, error: 'Only primary accounts can manage users', status: 403 };
    }

    return { authorized: true, userSub };
  } catch (error) {
    console.log('Error verifying primary user:', error);
    return { authorized: false, error: 'Server error during authorization', status: 500 };
  }
}

/**
 * GET: List all secondary users
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyPrimaryUser(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    //const auth0Manager = await _authManager();
    // Get all secondary users linked to this primary user
    const users = await auth0Manager.getSecondaryUsers();

    return NextResponse.json({
      success: true,
      users
    });
  } catch (error: any) {
    console.log('Error listing secondary users:', error);
    return NextResponse.json({ 
      error: 'Failed to list secondary users',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * POST: Create a new secondary user
 */
export async function POST(request: NextRequest) {
  try {
    //const auth0Manager = await _authManager();
    const authResult = await verifyPrimaryUser(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const { email, password, firstName, lastName } = body;
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({
        error: 'Missing required fields: email, password, firstName, lastName'
      }, { status: 400 });
    }

    // Create user params
    const userParams: CreateUserParams = {
      email,
      password,
      firstName,
      lastName,
      role: body.role || 'user',
      metadata: body.metadata
    };

    // Create the secondary user
    const newUser = await auth0Manager.createSecondaryUser(userParams);

    if (typeof newUser === 'string') {
      return NextResponse.json({ 
        error: 'Failed to create secondary user',
        details: newUser
      }, { status: 500 });
    } else {
      return NextResponse.json({
        success: !!newUser,
        user: newUser
      }, { status: 201 });
    }

    
  } catch (error: any) {
    console.log('Error creating secondary user:', error);
    return NextResponse.json({ 
      error: 'Failed to create secondary user',
      details: error.msg 
    }, { status: 500 });
  }
}

/**
 * PATCH: Update an existing secondary user
 */
export async function PATCH(request: NextRequest) {
  try {
    //const auth0Manager = await _authManager();
    const authResult = await verifyPrimaryUser(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Parse request body
    const body = await request.json();

    // Validate user ID
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({
        error: 'Missing required field: userId'
      }, { status: 400 });
    }

    // Extract update fields
    const updateParams: UpdateUserParams = {};
    
    if (body.firstName !== undefined) updateParams.firstName = body.firstName;
    if (body.lastName !== undefined) updateParams.lastName = body.lastName;
    if (body.email !== undefined) updateParams.email = body.email;
    if (body.role !== undefined) updateParams.role = body.role;
    if (body.status !== undefined) updateParams.status = body.status;
    if (body.metadata !== undefined) updateParams.metadata = body.metadata;

    // If no fields to update, return error
    if (Object.keys(updateParams).length === 0) {
      return NextResponse.json({
        error: 'No fields to update provided'
      }, { status: 400 });
    }

    // Update the user
    const updatedUser = await auth0Manager.updateSecondaryUser(userId, updateParams);

    if (!updatedUser) {
      return NextResponse.json({
        error: 'Failed to update user'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error: any) {
    console.log('Error updating secondary user:', error);
    return NextResponse.json({ 
      error: 'Failed to update secondary user',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * DELETE: Remove a secondary user
 */
export async function DELETE(request: NextRequest) {
  try {
    //const auth0Manager = await _authManager();
    const authResult = await verifyPrimaryUser(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Get user ID from the URL search params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        error: 'Missing required parameter: userId'
      }, { status: 400 });
    }

    // Delete the secondary user
    const success = await auth0Manager.deleteSecondaryUser(userId);

    if (!success) {
      return NextResponse.json({
        error: 'Failed to delete user'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User successfully deleted'
    });
  } catch (error: any) {
    console.log('Error deleting secondary user:', error);
    return NextResponse.json({ 
      error: 'Failed to delete secondary user',
      details: error.message 
    }, { status: 500 });
  }
}
