import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Simply redirect the user back to the subscription page
    return NextResponse.redirect(new URL('/subscription/cancel', req.url));
  } catch (error: any) {
    console.error('Error handling subscription cancel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process subscription cancellation' },
      { status: 500 }
    );
  }
}
