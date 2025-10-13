// === app/api/file/route.ts ===
// Created: 2025-10-06 12:00
// Purpose: API endpoint for uploading files to Vercel Blob storage
// Exports: POST handler
// Interactions: Used by prompt-input.tsx for file uploads
// Notes: Handles single file uploads, returns public blob URL

import { validateSession } from '@/lib/n8n/utils';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

/**
 * OVERVIEW
 *
 * - Purpose: Upload files to Vercel Blob and return public URLs
 * - Assumptions: Files are validated client-side, single file per request
 * - Edge Cases: Invalid file types, large files, network errors
 * - How it fits: Provides persistent storage for chat attachments
 * - Future Improvements: Support multiple files, add server-side validation
 */

export async function POST(request: NextRequest) {
  const {isValid} = await validateSession(request);
  if (!isValid) {
    console.log('GET /customer-profile - Invalid session');
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob with public access
    const blob = await put(`${nanoid()}_${file.name}`, file, {
      access: 'public',
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
export async function GET(request: NextRequest) {
  const {isValid} = await validateSession(request);
  if (!isValid) {
    console.log('GET /customer-profile - Invalid session');
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }
    const res = await fetch(decodeURIComponent(url));
    if (!res.ok) {
      console.log('File fetch error:', res.status, res.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch file from URL' },
        { status: 500 }
      );
    }
    const blob = await res.blob();
    //const arrayBuffer = await blob.arrayBuffer();
    //console.log('Fetched file blob:', blob.text());
    return NextResponse.json({ data: await blob.text() });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
/*
 * === app/api/file/route.ts ===
 * Updated: 2025-10-06 12:00
 * Summary: Handles file uploads to Vercel Blob storage
 * Key Components:
 *   - POST: Uploads file and returns blob URL
 * Dependencies:
 *   - Requires: @vercel/blob
 * Version History:
 *   v1.0 – initial implementation
 * Notes:
 *   - Public access enabled for chat attachments
 */