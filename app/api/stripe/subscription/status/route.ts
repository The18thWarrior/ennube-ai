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

async function getCustomerSubscription (sub: string) {
    try {
        const subscriptionData = await stripe.subscriptions.search({
            query: "status:'active' AND metadata['sub']:'" + sub + "'"
        });
        if (subscriptionData.data.length > 0) {
            const subscription = subscriptionData.data[0]; //subscription.customer;
            //console.log(subscription)
            // const invoices = await stripe.invoices.search({
            //     query: "customer:'" + subscription.customer + "'"
            // });

            // const portalSession = await stripe.billingPortal.sessions.create({
            //     customer: subscription.customer as string,
            //     return_url: `http://${'DOMAIN'}/api/stripe/callback?organization=${'organization'}`
            // });
            //console.log(portalSession);
            return subscription;
        } else {
            //return subscriptionData.data[0];
            return null;
        }
        //console.log(subscription);
    } catch (err) {
        console.log(err);
        return null;
    }
};