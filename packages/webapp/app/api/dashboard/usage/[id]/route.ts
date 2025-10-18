
import { NextRequest, NextResponse } from 'next/server';
import {
  getUserUsageLog,
  clearUserUsageLogBySub
} from '@/lib/db/usage-logs';
import { auth } from '@/auth';
import { sub } from 'date-fns/sub';
/**
 * DELETE /api/dashboard/usage/[id]
 * Clears usage log for a user by sub (subject ID)
 *
 * OVERVIEW
 * - Purpose: Remove all usage logs for a given user/sub
 * - Assumptions: [id] is the user's sub (subject ID)
 * - Edge Cases: Handles missing/invalid sub, errors from clearUserUsageLogBySub
 * - Future: Add authentication/authorization checks if needed
 */

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Input validation
  const { id } = await params;
  if (!id || typeof id !== "string" || id.length < 6) {
    return new Response(JSON.stringify({ error: "Invalid log id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const session = await auth();
  if (!session?.user.sub) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const result = await clearUserUsageLogBySub(id, session.user.sub);
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Structured error logging, no secrets
    console.error("DELETE usage log error", { sub, error });
    return new Response(JSON.stringify({ error: "Failed to clear usage log" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// /api/message/[id]?subId=...
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: threadId } = await params;
    const session = await auth();
    if (!session?.user.sub) {
        return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
        );
    }
    //const subId = session.user.sub;
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
