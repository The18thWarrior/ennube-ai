import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil', // Use the latest API version,
  typescript: true,
});
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to check subscription status' },
        { status: 401 }
      );
    }

    const customer = await getCustomer(session.user.auth0?.sub as string);
    if (!customer) {
        return NextResponse.json(
            { error: 'Failed to find customer' },
            { status: 500 }
        );
    }

    const portalLink = await createPortalLink(typeof customer === 'string' ? customer : customer.id);
    if (!portalLink) {
      return NextResponse.json(
        { error: 'Failed to create portal link' },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: portalLink });
  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}

async function getCustomer (subId: string) {
    try {
        const subscriptionData = await stripe.subscriptions.search({
            query: "status:'active' AND metadata['sub']:'" + subId + "'"
        });
        if (subscriptionData.data.length > 0) {
            const subscription = subscriptionData.data[0]
            return subscription.customer;
        }
        return null;
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function createPortalLink (customerId: string) {
    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.BASE_URL || process.env.VERCEL_URL || 'https://app.ennube.ai'}/dashboard`
        });
        return session.url;
    } catch (err) {
        console.log(err);
        return null;
    }
}