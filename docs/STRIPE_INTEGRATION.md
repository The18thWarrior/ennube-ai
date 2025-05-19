# Stripe Integration

This project includes Stripe integration for handling subscriptions using Stripe Checkout Sessions.

## Setup

1. Create a Stripe account at [stripe.com](https://stripe.com) if you don't have one
2. Get your API keys from the Stripe Dashboard
3. Set up a product and a subscription price in the Stripe Dashboard
4. Copy the `.env.local.example` file to `.env.local` and fill in your Stripe credentials:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_PRICE_ID=price_your_subscription_price_id
STRIPE_PRICE_ID_PRO=price_your_subscription_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

## How It Works

This integration uses the following components:

1. **Stripe Context** (`/lib/stripe-context.tsx`) - Provides a React context for Stripe functionality
2. **Subscribe Button** (`/components/subscribe-button.tsx`) - Button in the navigation bar that links to the subscription page
3. **Checkout API** (`/app/api/checkout/route.ts`) - API endpoint that creates a Stripe checkout session
4. **Subscription Page** (`/app/subscription/page.tsx`) - Page that displays subscription status and checkout options
5. **Webhook Handler** (`/app/api/webhooks/stripe/route.ts`) - Handles Stripe webhook events

## Testing the Integration

To test the integration locally, you'll need to:

1. Start your development server
2. Use Stripe's test cards for testing payments (e.g., 4242 4242 4242 4242)
3. For testing webhooks locally, you can use the Stripe CLI to forward events to your local server:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

## Deployment

When deploying to production:

1. Make sure to update your environment variables with production Stripe API keys
2. Configure the webhook endpoint in your Stripe Dashboard to point to your production URL
3. Update the success and cancel URLs in the checkout session creation to use your production domain

## Database Integration

For a complete implementation, you should store subscription information in your database:

1. Create a `subscriptions` table or collection in your database
2. Update the webhook handler to store subscription events in your database
3. Modify the subscription status API to query your database for active subscriptions

## Resources

- [Stripe Checkout Documentation](https://docs.stripe.com/api/checkout/sessions)
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks)
- [Stripe Customer Portal](https://docs.stripe.com/customer-portal)
