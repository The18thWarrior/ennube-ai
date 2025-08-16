import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { removeMicrosoftCredentials } from '@/lib/db/microsoft-storage';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.auth0?.sub) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const success = await removeMicrosoftCredentials();
    if (!success) {
      return NextResponse.json({ error: 'Failed to remove Microsoft credentials' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Successfully disconnected Microsoft account' });
  } catch (error) {
    console.log('Error logging out of Microsoft:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
