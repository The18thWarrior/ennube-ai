import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/admin';

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
    if (!isAdmin(userSub)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    console.log('Error fetching api keys:', error);
    return NextResponse.json({ error: 'Failed to fetch api keys' }, { status: 500 });
  }
}
