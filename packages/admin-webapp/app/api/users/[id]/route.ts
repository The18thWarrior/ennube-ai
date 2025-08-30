// === route.ts ===
// Created: 2025-08-30 12:31
// Purpose: API route to view, update, and delete a single Auth0 user
// Exports: GET, PATCH, DELETE

import { auth0Client } from '../../../../lib/auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await Promise.resolve(params);
    const user = await auth0Client.getUser(id);
  return NextResponse.json(user, { status: 200 });
  } catch (err: any) {
  const body = { error: err?.message ?? 'Unknown error', details: err?.details ?? null };
  return NextResponse.json(body, { status: err?.status ?? 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await Promise.resolve(params);
  const data = await req.json();
    const updated = await auth0Client.updateUser(id, data);
  return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
  const body = { error: err?.message ?? 'Unknown error', details: err?.details ?? null };
  return NextResponse.json(body, { status: err?.status ?? 500 });
  }
} 

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await Promise.resolve(params);
  await auth0Client.deleteUser(id);
  return new NextResponse(null, { status: 204 });
  } catch (err: any) {
  const body = { error: err?.message ?? 'Unknown error', details: err?.details ?? null };
  return NextResponse.json(body, { status: err?.status ?? 500 });
  }
}
