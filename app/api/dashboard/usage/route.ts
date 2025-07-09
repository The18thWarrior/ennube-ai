import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { getUserUsageLogsBySub, storeUsageLog } from '@/lib/db/usage-logs';
import { nanoid } from 'nanoid';


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
    const params = {
      userSub: sub,
      agent: agent,
      recordsUpdated: 0,
      recordsCreated: 0,
      meetingsBooked: 0,
      queriesExecuted: 0, // Initialize queriesExecuted to 0
      signature: null,
      nonce: 0,
      logId: logId,
      isNew: true,
      status: null,
      errors: null,
      recordId: null
    };
    await storeUsageLog(params);
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
    console.log("body", body);
    console.log("searchParams", searchParams);
    const sub = body.sub || searchParams.get('sub');
    const id = body.id || searchParams.get('id');
    const agent = body.agent || searchParams.get('agent');
    const status = body.status || searchParams.get('status');
    const recordsUpdated = body.recordsUpdated || searchParams.get('recordsUpdated');
    const recordsCreated = body.recordsCreated || searchParams.get('recordsCreated');
    const meetingsBooked = body.meetingsBooked || searchParams.get('meetingsBooked');
    const queriesExecuted = body.queriesExecuted || searchParams.get('queriesExecuted');
    const recordId = body.recordId || searchParams.get('recordId');
    const errors = body.errors || searchParams.get('errors');

    // Validate required parameters
    if (!sub) {
      return NextResponse.json(
        { error: 'Missing required parameter: sub' },
        { status: 400 }
      );
    }

    const params = {
      userSub: sub,
      agent: agent,
      recordsUpdated: recordsUpdated,
      recordsCreated: recordsCreated,
      meetingsBooked: meetingsBooked,
      queriesExecuted: queriesExecuted,
      signature: "",
      nonce: 0,
      logId: id,
      isNew: false,
      status: status,
      errors: errors,
      recordId: recordId
    };
    // Store the usage log in the database
    await storeUsageLog(params);
    
    return NextResponse.json({id});
  } catch (error: any) {
    console.error('Error storing usage log:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store usage log' },
      { status: 500 }
    );
  }
}
