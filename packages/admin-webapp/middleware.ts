import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require the global cookie
const PUBLIC_PATHS = ['/auth', '/api/auth/login', '/api/auth/logout', '/_next', '/favicon.ico', '/robots.txt', '/api/public', '/global.css'];

async function computeHash(password: string, secret: string) {
  // Use Web Crypto (available in Edge runtime) to compute SHA-256 hex
  const data = new TextEncoder().encode(`${password}:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Allow public assets and auth endpoints
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Treat any CSS file as public so stylesheets don't require auth.
  if (pathname.endsWith('.css')) return NextResponse.next();
  if (pathname.endsWith('.png')) return NextResponse.next();

  // Read cookie
  const cookie = req.cookies.get('ennube_auth')?.value ?? null;

  // If no cookie, redirect to /auth
  if (!cookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth';
    return NextResponse.redirect(loginUrl);
  }

  // Compute expected value from env vars
  const globalPassword = process.env.ADMIN_GLOBAL_PASSWORD || '';
  const secret = process.env.ADMIN_AUTH_SECRET || 'change-this-secret';
  const expected = await computeHash(globalPassword, secret);

  if (cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/auth';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|global.css).*)"],
};
