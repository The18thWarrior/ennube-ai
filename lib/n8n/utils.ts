// === utils.ts ===
// Created: 2025-07-26  
// Purpose: Utility functions for n8n integration, including header validation
// Exports:
//   - validateHeader
// Interactions:
//   - Used by: n8n API routes
// Notes:
//   - Validates Basic Auth header against env var
'use server';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

/**
 * OVERVIEW
 *
 * - Purpose: Validates Basic Auth header in Next.js API routes for n8n endpoints.
 * - Assumptions: Env var N8N_BASIC_AUTH is set as 'username:password' (base64 encoded or plain).
 * - Edge Cases: Handles missing/invalid headers, malformed base64, and timing attacks.
 * - How it fits: Used to protect n8n endpoints from unauthorized access.
 * - Future: Consider supporting multiple users or rotating secrets.
 */

/**
 * Validates the Basic Authorization header in a Next.js request against a static environment variable.
 * @param req NextRequest object
 * @returns boolean true if valid, false otherwise
 */
async function validateHeader(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  const base64Credentials = authHeader.replace('Basic ', '').trim();
  let credentials: string;
  try {
    credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  } catch {
    return false;
  }

  // Env var should be in 'username:password' format
  const expected = process.env.N8N_BASIC_AUTH;
  if (!expected) return false;

  // Constant-time comparison to prevent timing attacks
  const credBuf = Buffer.from(credentials);
  const expBuf = Buffer.from(expected);
  if (credBuf.length !== expBuf.length) return false;
  return timingSafeEqual(credBuf, expBuf);
}

interface SessionValidationResponse {
    isValid: boolean;
    userId: string | null;
}

export async function validateSession(req: NextRequest): Promise<SessionValidationResponse> {
    const session = await auth();
    if (!session?.user?.auth0?.sub && !(await validateHeader(req))) {
        return { isValid: false, userId: null };
    }

    const { searchParams } = new URL(req.url);
    return { isValid: true, userId: session?.user?.auth0?.sub || searchParams.get('subId') || searchParams.get('sub') };
}

/**
 * === utils.ts ===
 * Updated: 2025-07-26
 * Summary: Utility for validating Basic Auth header in Next.js API routes.
 * Key Components:
 *   - validateHeader(): Checks Basic Auth against env var
 * Dependencies:
 *   - NextRequest, process.env, crypto
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Only supports single static credential
 */
