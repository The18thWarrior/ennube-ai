import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { proposeUpdate } from '@/lib/chat/sfdc/propose-update';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.auth0?.sub) {
      console.log(session);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { nlRequest, context } = body || {};
    if (!nlRequest || typeof nlRequest !== 'string') {
      return NextResponse.json({ error: 'Invalid input: nlRequest required' }, { status: 400 });
    }

    const result = await proposeUpdate(nlRequest, { ...context, userId: session.user.auth0.sub });
    return NextResponse.json(result);
  } catch (error) {
    console.log('Error in propose route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
