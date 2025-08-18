import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, updateApiKey, deleteApiKey } from '@/lib/db/api-keys-storage';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params:  Promise<{ id: string }>  }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSub = session.user.id || session.user.email;
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'API key ID required' }, { status: 400 });
    }

    const apiKey = await getApiKey(id);
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }
    if (apiKey.userId !== userSub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(apiKey);
  } catch (error) {
    console.log('Error fetching api key:', error);
    return NextResponse.json({ error: 'Failed to fetch api key' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSub = session.user.id || session.user.email;
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'API key ID required' }, { status: 400 });
    }

    const existing = await getApiKey(id);
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }
    if (existing.userId !== userSub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await request.json();
    const { userId } = payload;

    const success = await updateApiKey(id, { userId: userId || existing.userId });
    if (!success) {
      return NextResponse.json({ error: 'Failed to update api key' }, { status: 500 });
    }
    const updated = await getApiKey(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.log('Error updating api key:', error);
    return NextResponse.json({ error: 'Failed to update api key' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSub = session.user.id || session.user.email;
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'API key ID required' }, { status: 400 });
    }

    const existing = await getApiKey(id);
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }
    if (existing.userId !== userSub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await deleteApiKey(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete api key' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('Error deleting api key:', error);
    return NextResponse.json({ error: 'Failed to delete api key' }, { status: 500 });
  }
}
