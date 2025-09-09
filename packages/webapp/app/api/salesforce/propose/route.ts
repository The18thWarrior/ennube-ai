import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { proposeUpdate } from '@/lib/chat/sfdc/propose-update';

export async function POST(request: NextRequest) {
  try {
    
    const searchParams = request.nextUrl.searchParams;
    const sub = searchParams.get('sub');
    if (!sub) {
      return NextResponse.json({ error: 'Missing sub parameter' }, { status: 400 });
    }

    const body = await request.json();
    const { nlRequest, context } = body || {};
    if (!nlRequest || typeof nlRequest !== 'string') {
      return NextResponse.json({ error: 'Invalid input: nlRequest required' }, { status: 400 });
    }

    const result = await proposeUpdate(nlRequest, { ...context, userId: sub });
    return NextResponse.json(result);
  } catch (error) {
    console.log('Error in propose route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
