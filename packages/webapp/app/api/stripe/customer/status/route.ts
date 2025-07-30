import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil', // Use the latest API version,
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
    if (customer) return NextResponse.json({ customerId: customer.id });

    const newCustomer = await createCustomer(session.user.auth0?.sub as string, session.user.email as string);
    if (newCustomer) return NextResponse.json({ customerId: newCustomer });

    return NextResponse.json({ customerId: null });
  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}

async function createCustomer(subId: string, userEmail: string) {
    try {
        const customer = await stripe.customers.create({
            name: userEmail,
            email: userEmail,
            metadata: {
                sub: subId
            }
        });
        return customer.id;
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function getCustomer (subId: string) {
    try {
        const customer = await stripe.customers.search({
          query: "metadata['sub']:'" + subId + "'"
        });
        console.log(customer, subId);
        if (customer.data.length > 0) {
          return customer.data[0];
        }
        return null;
    } catch (err) {
        console.log(err);
        return null;
    }
}