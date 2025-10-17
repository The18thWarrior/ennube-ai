import { NextRequest, NextResponse } from 'next/server';
import { auth, signIn } from '@/auth';
import { isAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    await signIn('auth0', { redirectTo: '/' });
    //return NextResponse.redirect('/login');
  }
  return NextResponse.redirect('/login');

}
