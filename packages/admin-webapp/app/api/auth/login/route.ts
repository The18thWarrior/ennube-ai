import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { password } = body || {};

  const globalPassword = process.env.ADMIN_GLOBAL_PASSWORD || '';
  const secret = process.env.ADMIN_AUTH_SECRET || 'change-this-secret';

  if (!password || password !== globalPassword) {
    return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
  }

  // Compute simple server-side hash to store in cookie (so cookie isn't raw password)
  const hash = await (async () => {
    const data = new TextEncoder().encode(`${globalPassword}:${secret}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  })();

  const res = NextResponse.json({ ok: true });
  // Cookie valid for 7 days
  res.cookies.set({ name: 'ennube_auth', value: hash, httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
  return res;
}
