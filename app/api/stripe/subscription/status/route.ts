import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCustomerSubscription } from '@/lib/stripe';

// Initialize Stripe with your secret key

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to check subscription status' },
        { status: 401 }
      );
    }

    const subscription = await getCustomerSubscription(session.user.auth0?.sub as string);
    if (!subscription) return NextResponse.json({ error: 'No subscription found' },{ status: 500 });
    // Dummy response for demo purposes
    const dummySubscription = {
      isActive: false
      // If the user had an active subscription, you would include details like:
      // plan: 'Premium',
      // currentPeriodEnd: '2023-12-31',
      // status: 'active'
    };

    return NextResponse.json({ subscription: JSON.parse(JSON.stringify(subscription)) });
  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}

