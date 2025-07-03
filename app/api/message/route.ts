
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllUserHistories,
  deleteAllUserThreads,
} from '../../../lib/cache/message-history';
import { auth } from '@/auth';

// /api/message?subId=...
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.auth0?.sub) {
    return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
    );
    }
    const subId = session.user.auth0.sub;
    const histories = await getAllUserHistories(subId);
    return NextResponse.json(histories);
}

export async function DELETE(req: NextRequest) {
      const session = await auth();
    if (!session?.user?.auth0?.sub) {
    return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
    );
    }
    const subId = session.user.auth0.sub;
    await deleteAllUserThreads(subId);
    return NextResponse.json({ success: true });
}
