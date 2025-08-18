import { NextRequest, NextResponse } from 'next/server';
import { getUserApiKeys, saveApiKey, getApiKey, updateApiKey, deleteApiKey } from '@/lib/db/api-keys-storage';
import { generateApiKey, sha256 } from '@/lib/utils';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSub = session.user.id || session.user.email;
    if (!userSub) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const apiKeys = await getUserApiKeys(userSub);
    return NextResponse.json(apiKeys);
  } catch (error) {
    console.log('Error fetching api keys:', error);
    return NextResponse.json({ error: 'Failed to fetch api keys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSub = session.user.id || session.user.email;
    if (!userSub) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Server-side generate a secure token, store only its hash, and return the plain token once
    const token = generateApiKey();
    const hashed = sha256(token);
    const id = await saveApiKey({ userId: userSub, hash: hashed });
    if (!id) {
      return NextResponse.json({ error: 'Failed to create api key' }, { status: 500 });
    }
    // Return the created id and the token (one-time display)
    return NextResponse.json({ id, token });
  } catch (error) {
    console.log('Error creating api key:', error);
    return NextResponse.json({ error: 'Failed to create api key' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSub = session.user.id || session.user.email;
    if (!userSub) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const payload = await request.json();
    const { id, userId } = payload;

    if (!id) {
      return NextResponse.json({ error: 'API key ID required' }, { status: 400 });
    }

    // Optionally ensure the caller owns the key
    const existing = await getApiKey(id);
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }
    if (existing.userId !== userSub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSub = session.user.id || session.user.email;
    if (!userSub) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const payload = await request.json();
    const { id } = payload;
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
