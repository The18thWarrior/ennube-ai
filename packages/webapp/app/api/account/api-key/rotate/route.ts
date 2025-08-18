import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getApiKey, rotateApiKey } from '@/lib/db/api-keys-storage';
import { generateApiKey, sha256 } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const userSub = session.user.id || session.user.email;
    const payload = await request.json();
    const { id } = payload;
    if (!id) return NextResponse.json({ error: 'API key ID required' }, { status: 400 });

    const existing = await getApiKey(id);
    if (!existing) return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    if (existing.userId !== userSub) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const token = generateApiKey();
    const hashed = sha256(token);
    const ok = await rotateApiKey(id, hashed);
    if (!ok) return NextResponse.json({ error: 'Failed to rotate api key' }, { status: 500 });

    return NextResponse.json({ id, token });
  } catch (error) {
    console.log('Error rotating api key:', error);
    return NextResponse.json({ error: 'Failed to rotate api key' }, { status: 500 });
  }
}
