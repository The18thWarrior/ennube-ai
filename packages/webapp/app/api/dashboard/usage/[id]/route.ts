
import { NextRequest, NextResponse } from 'next/server';
import {
  getUserUsageLog,
} from '@/lib/db/usage-logs';
import { auth } from '@/auth';

// /api/message/[id]?subId=...
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: threadId } = await params;
    const session = await auth();
    if (!session?.user?.auth0?.sub) {
        return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
        );
    }
    //const subId = session.user.auth0.sub;
    if (!threadId) {
      console.log('missing thread id');
        return NextResponse.json({ error: 'Missing thread id' }, { status: 400 });
    }
    const thread = await getUserUsageLog(threadId);
    if (!thread) {
      console.log('Thread not found', { threadId });
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }
    return NextResponse.json(thread);
}
