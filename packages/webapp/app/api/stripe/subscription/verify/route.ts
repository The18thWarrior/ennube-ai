import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil', // Use the latest API version,
  typescript: true,
});

export async function GET(req: NextRequest) {
  try {
    // Get the current session to identify the user
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to check subscription status' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session to verify it
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, message: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Here you would typically update your database to mark the user as subscribed
    // For this example, we'll just return success

    return NextResponse.json({
      success: true,
      subscription: {
        status: checkoutSession.payment_status,
        customerId: checkoutSession.customer,
        subscriptionId: checkoutSession.subscription,
      }
    });
  } catch (error: any) {
    console.log('Error verifying subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify subscription' },
      { status: 500 }
    );
  }
}
