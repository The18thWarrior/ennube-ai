import { NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/microsoft';
import { upsertMicrosoftCredentials } from '@/lib/db/microsoft-storage';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code) return NextResponse.redirect('/auth?error=missing_code');
  const session = await auth();
  if (!session?.user?.auth0?.sub) {
    return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
    );
  }
  const userId = session.user.auth0.sub;
  const origin = url.origin;
  const redirectUri = `${origin}/api/microsoft/oauth2/callback`;

  try {
    const tokens = await exchangeCodeForToken({ code, redirectUri });

    if (userId) {
      await upsertMicrosoftCredentials(userId, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt || null,
        raw: tokens.raw,
      });
    }

    // If state contains returnTo, redirect back
    let returnTo = '/';
    try {
      if (state) {
        const parsed = JSON.parse(state);
        if (parsed && parsed.returnTo) returnTo = parsed.returnTo;
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.redirect(returnTo);
  } catch (err) {
    console.error('Microsoft callback error', err);
    return NextResponse.redirect('/auth?error=microsoft_callback_failed');
  }
}
