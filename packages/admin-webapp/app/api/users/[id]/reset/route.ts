// === route.ts ===
// Created: 2025-08-30 12:31
// Purpose: API route to view, update, and delete a single Auth0 user
// Exports: GET, PATCH, DELETE

import { auth0Client } from '../../../../../lib/auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await Promise.resolve(params);
    await auth0Client.resetPassword({ userId: id });
    return NextResponse.json({ message: 'Password reset email sent' }, { status: 200 });
  } catch (err: any) {
  const body = { error: err?.message ?? 'Unknown error', details: err?.details ?? null };
  return NextResponse.json(body, { status: err?.status ?? 500 });
  }
}
