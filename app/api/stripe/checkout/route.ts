import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil', // Use the latest API version,
  typescript: true,
});

export async function POST(req: NextRequest) {
  try {
    // Get the current session to identify the user
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to create a checkout session' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const isPro = Boolean(searchParams.get('pro')) || false; // Default to 10 if not specified
    
    //STRIPE_PRICE_ID_PRO

    // Create a Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: isPro ? process.env.STRIPE_PRICE_ID_PRO : process.env.STRIPE_PRICE_ID, // Your predefined price ID from Stripe dashboard
          quantity: 1,
          adjustable_quantity: {
            enabled: true
          }
        },
      ],
      allow_promotion_codes: true,
      mode: 'subscription',
      success_url: `${process.env.BASE_URL || process.env.VERCEL_URL || 'https://app.ennube.ai'}/api/stripe/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || process.env.VERCEL_URL || 'https://app.ennube.ai'}/api/stripe/subscription/cancel`,
      customer_email: session.user.email || undefined,
      metadata: {
        userId: session.user.id || session.user.email || 'unknown',
      },
      subscription_data: {
        trial_period_days: 30
      }
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
