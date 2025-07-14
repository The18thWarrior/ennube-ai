
import { NextRequest, NextResponse } from 'next/server';
import {
  getThread,
  setThread,
  deleteThread,
} from '../../../../lib/cache/message-history';
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
    const thread = await getThread(threadId);
    if (!thread) {
      setTimeout(async () => {
        const thread2 = await getThread(threadId);
        if (thread2) {
          return NextResponse.json(thread2);
        } else {
          console.log('Thread not found', { threadId });
          return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
        }
      }, 5000)
      
    } else {
      return NextResponse.json(thread);
    }    
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  
    const session = await auth();
    if (!session?.user?.auth0?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const subId = session.user.auth0.sub;
    const { id: threadId } = await params;
    const { messages, name, currentAgent } = await req.json();
    if (!threadId || !subId || !Array.isArray(messages)) {
      console.log('Missing threadId, subId, or messages', { threadId, subId, messages }); 
        return NextResponse.json({ error: 'Missing threadId, subId, or messages' }, { status: 400 });
    }
    await setThread(threadId, subId, messages, name, currentAgent);
    return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.auth0?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const { id: threadId } = await params;
    const subId = session.user.auth0.sub;
    if (!threadId) {
        return NextResponse.json({ error: 'Missing thread id' }, { status: 400 });
    }
    await deleteThread(threadId, subId);
    return NextResponse.json({ success: true });
}
