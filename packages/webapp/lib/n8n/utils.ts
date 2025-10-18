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
import { getBaseUrl } from '../chat/helper';

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
  console.log('Validating header:', authHeader)
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
    if (!session?.user.sub && !(await validateHeader(req))) {
        console.log( 'Invalid session or header');
        return { isValid: false, userId: null };
    }

    const { searchParams } = new URL(req.url);
    return { isValid: true, userId: session?.user.sub || searchParams.get('subId') || searchParams.get('sub') };
}

export async function buildCalloutWithHeader(url: string, body: any, method: 'GET' | 'POST' | 'PATCH' | 'PUT' = 'GET'): Promise<Response> {
    const basicAuth = process.env.N8N_BASIC_AUTH;
    const basicHeader = Buffer.from(basicAuth as string).toString('base64');
    const baseUrl = await getBaseUrl();
    if (body && method !== 'GET') {
        return fetch(`${baseUrl}${url}`, {
            method: method,
            headers: {
                'Authorization': `Basic ${basicHeader}`
            },
            body: JSON.stringify(body)
        });
    }

    return fetch(`${baseUrl}${url}`, {
        method: method,
        headers: {
            'Authorization': `Basic ${basicHeader}`
        }
    });
    
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
