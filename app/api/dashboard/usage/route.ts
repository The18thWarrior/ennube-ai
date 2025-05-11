import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { getUserUsageLogsBySub, storeUsageLog } from '@/lib/usage-logs';
import { nanoid } from 'nanoid';
import { log } from 'console';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const sub = body.sub || searchParams.get('sub');
    const agent = body.agent || searchParams.get('agent');
    // Validate required parameters
    if (!sub) {
      return NextResponse.json(
        { error: 'Missing required parameter: sub' },
        { status: 400 }
      );
    }
    // Store the usage log in the database
    const logId = nanoid();
    await storeUsageLog(sub, agent, 0,0,0,"",0, logId);
    return NextResponse.json({id: logId});
  } catch (error: any) {
    console.error('Error storing usage log:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store usage log' },
      { status: 500 }
    );
  }
}


export async function PUT(request: NextRequest) {
  try {

    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const sub = body.sub || searchParams.get('sub');
    const id = body.id || searchParams.get('id');
    const agent = body.agent || searchParams.get('agent');
    const status = body.status || searchParams.get('status');
    const recordsUpdated = body.recordsUpdated || searchParams.get('recordsUpdated');
    const recordsCreated = body.recordsCreated || searchParams.get('recordsCreated');
    const meetingsBooked = body.meetingsBooked || searchParams.get('meetingsBooked');

    // Validate required parameters
    if (!sub) {
      return NextResponse.json(
        { error: 'Missing required parameter: sub' },
        { status: 400 }
      );
    }
    // Store the usage log in the database
    await storeUsageLog(sub, agent, recordsUpdated, recordsCreated, meetingsBooked, "", 0, id, false, status);
    return NextResponse.json({id});
  } catch (error: any) {
    console.error('Error storing usage log:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store usage log' },
      { status: 500 }
    );
  }
}
