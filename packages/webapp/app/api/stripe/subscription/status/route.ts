import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCustomerSubscription } from '@/lib/stripe';
import { getLicenseBySubId } from '@/lib/db/license-storage';
import { get } from 'http';
import subscriptionCache from '@/lib/cache/subscription-cache';

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
    let isPrimary = false;
    let subscription = await getCustomerSubscription(session.user.sub as string);
    let manualSubscription = await subscriptionCache.get(session.user.sub as string);
    // Is manual subscription take precedence?
    if (manualSubscription) {
      console.log('Using manual subscription for user:', session.user.sub);
      return NextResponse.json({ subscription: JSON.parse(JSON.stringify(manualSubscription.subscription)), isPrimary: true });
    } 

    if (!subscription) {
      const license = await getLicenseBySubId(session.user.sub as string);
      if (license && license.parentSubId) {
        // If a license is found, you can use it to create a subscription
        subscription = await getCustomerSubscription(license.parentSubId);
      }
    } else {
      isPrimary = true;
    }
    
    
    //console.log('Subscription found:', subscription);
    if (!subscription) return NextResponse.json({ error: 'No subscription found' },{ status: 500 });

    return NextResponse.json({ subscription: JSON.parse(JSON.stringify(subscription)), isPrimary });
  } catch (error: any) {
    console.log('Error checking subscription status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}

