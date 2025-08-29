import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil', // Use the latest API version,
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook secret not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.log(`⚠️ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        // Here you would update your database to record the subscription
        console.log(`User ${checkoutSession.metadata?.userId} completed checkout for subscription ${checkoutSession.subscription}`);
        break;
        
      case 'customer.subscription.created':
        const subscriptionCreated = event.data.object as Stripe.Subscription;
        // Handle subscription created
        console.log(`Subscription created: ${subscriptionCreated.id}`);
        break;
        
      case 'customer.subscription.updated':
        const subscriptionUpdated = event.data.object as Stripe.Subscription;
        // Handle subscription update
        console.log(`Subscription updated: ${subscriptionUpdated.id}`);
        break;
        
      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object as Stripe.Subscription;
        // Handle subscription cancellation
        console.log(`Subscription cancelled: ${subscriptionDeleted.id}`);
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        // Handle successful invoice payment
        console.log(`Invoice paid: ${invoice.id}`);
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        // Handle failed invoice payment
        console.log(`Invoice payment failed: ${failedInvoice.id}`);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.log('Error handling webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing webhook' },
      { status: 500 }
    );
  }
}
