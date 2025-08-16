import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/microsoft';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || '/';
  const state = JSON.stringify({ returnTo });
  const redirectUri = `${url.origin}/api/microsoft/oauth2/callback`;
  const authUrl = getAuthUrl({ state, redirectUri });
  return NextResponse.redirect(authUrl);
}
