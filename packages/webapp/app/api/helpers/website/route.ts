import { htmlToMarkdown } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import {Agent} from 'https';

const httpsAgent = new Agent({
      rejectUnauthorized: false,
});

export async function GET(request: NextRequest) {
  try {
    
    
    const website = request.nextUrl.searchParams.get('url');
    if (!website) {
      return NextResponse.json(
        { error: 'url parameter is required' },
        { status: 400 }
      );
    }
    const result = await fetch(website, { agent: httpsAgent });
    if (!result.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch the website' },   
        { status: 500 }
      );
    }
    const markdown = await htmlToMarkdown(await result.text());
    //return NextResponse.json(markdown);
    return new Response(markdown, {
        status: 200,
        headers: {
        'content-type': 'text/plain',
        },
    })
  } catch (error: any) {
    console.log('Error retrieving website:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve website' },
      { status: 500 }
    );
  }
}