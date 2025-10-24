import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { removeGSuiteCredentials } from '@/lib/db/gsuite-storage';

/**
 * POST /api/gsuite/logout
 * Remove GSuite credentials for the authenticated user
 * 
 * Response:
 * - 200 OK: Successfully logged out
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Remove the credentials
    const success = await removeGSuiteCredentials();
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove GSuite credentials' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected Google account'
    });
  } catch (error) {
    console.log('Error logging out of GSuite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
