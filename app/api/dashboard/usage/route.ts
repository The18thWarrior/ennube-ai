import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { getUserUsageLogsBySub } from '@/lib/usage-logs';

export async function GET(request: NextRequest) {
  try {
    // Get the current session to identify the user
    const session = await auth();
    if (!session || !session.user || !session.user.auth0) {
      return NextResponse.json(
        { error: 'You must be signed in to retrieve usage logs' },
        { status: 401 }
      );
    }    
    const userSub = session.user.auth0.sub;
    
    const limit = request.nextUrl.searchParams.get('limit') || '10';
    const offset = request.nextUrl.searchParams.get('offset') || '0';

    const logs = await getUserUsageLogsBySub(userSub, Number(limit), Number(offset));
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error retrieving usage logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve usage logs' },
      { status: 500 }
    );
  }
}
