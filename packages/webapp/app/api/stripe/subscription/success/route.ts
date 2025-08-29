import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

export async function GET(req: NextRequest) {
  try {
    // Get the current session to identify the user
    const session = await auth();
    
    if (!session || !session.user) {
    //   return NextResponse.json(
    //     { error: 'You must be signed in to verify a subscription' },
    //     { status: 401 }
    //   );

        return NextResponse.redirect(new URL('/subscription?error=You must be signed in to verify a subscription', req.url));
    }

    // Get the session_id from the URL query parameters
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
    //   return NextResponse.json(
    //     { error: 'Missing session_id parameter' },
    //     { status: 400 }
    //   );
      return NextResponse.redirect(new URL('/subscription?error=Missing session_id parameter', req.url));
      
    }

    // Retrieve the checkout session from Stripe to verify it was successful
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Verify the payment was successful
    if (checkoutSession.payment_status !== 'paid') {
    //   return NextResponse.json(
    //     { error: 'Payment was not successful' },
    //     { status: 400 }
    //   );
      return NextResponse.redirect(new URL('/subscription?error=Payment was not successful', req.url));
    }
    //console.log('checkoutSession', checkoutSession);
    // You might want to update the user's subscription status in your database here
    await stripe.subscriptions.update(checkoutSession.subscription as string, { metadata: { sub: checkoutSession.metadata?.userId || ''} });

    // Redirect to the dashboard
    return NextResponse.redirect(new URL('/subscription/success?session_id=' + sessionId, req.url));
  } catch (error: any) {
    console.log('Error handling subscription success:', error);
    // return NextResponse.json(
    //   { error: error.message || 'Failed to process successful subscription' },
    //   { status: 500 }
    // );
    return NextResponse.redirect(new URL(`/subscription?error=${error.message || 'Failed to process successful subscription'}`, req.url));
  }
}
