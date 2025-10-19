import { NextRequest, NextResponse } from 'next/server';
import subscriptionCache, { ManualSubscriptionRecord } from '../../../../lib/cache/subscription-cache';
import type { SubscriptionStatus } from '../../../../lib/types';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/admin';

/**
 * Admin API: /api/admin/subscriptions
 * Supports:
 *  - GET  => list all subscriptions or single by ?subId=...
 *  - POST => create a new subscription record { subId, subscription }
 *  - PUT  => update (upsert) a subscription record; body { subId, subscription }
 *  - DELETE => delete a subscription by ?subId=... or body { subId }
 *
 * Notes: This endpoint does not enforce auth here. Wire NextAuth/middleware as needed.
 */

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user.sub || session?.user?.id;
    if (!userId || !isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const subId = url.searchParams.get('subId');
    if (subId) {
      const rec = await subscriptionCache.get(subId);
      if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(rec);
    }

    const all = await subscriptionCache.listAll();
    return NextResponse.json(all);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user.sub || session?.user?.id;
    if (!userId || !isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) as Partial<ManualSubscriptionRecord> | undefined;
    if (!body || !body.subId || !body.subscription) {
      return NextResponse.json({ error: 'Missing subId or subscription in body' }, { status: 400 });
    }

    // Basic shape check - ensure subscription has id and status
    const subscription = body.subscription as SubscriptionStatus;
    if (!subscription || !subscription.id) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    await subscriptionCache.upsert({ subId: body.subId, subscription });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user.sub || session?.user?.id;
    if (!userId || !isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) as Partial<ManualSubscriptionRecord> | undefined;
    if (!body || !body.subId || !body.subscription) {
      return NextResponse.json({ error: 'Missing subId or subscription in body' }, { status: 400 });
    }

    await subscriptionCache.upsert({ subId: body.subId, subscription: body.subscription as SubscriptionStatus });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user.sub || session?.user?.id;
    if (!userId || !isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    let subId = url.searchParams.get('subId');
    if (!subId) {
      // try body
      try {
        const body = (await req.json()) as { subId?: string } | undefined;
        subId = body?.subId ?? null;
      } catch {
        // ignore
      }
    }

    if (!subId) {
      return NextResponse.json({ error: 'Missing subId' }, { status: 400 });
    }

    await subscriptionCache.delete(subId);
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
