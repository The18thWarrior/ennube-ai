import Stripe from 'stripe';
import { SubscriptionStatus } from './types';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil', // Use the latest API version,
  typescript: true,
});
export async function getCustomerSubscription (sub: string) {
    try {
      const query = `metadata['sub']:'${sub}'`;
      //console.log(query);
      //console.log()
        const subscriptionData = await stripe.subscriptions.search({
            query
        });
        //console.log(subscriptionData);
        if (subscriptionData.data.length > 0) {
            if (subscriptionData.data.length > 1) {
                console.warn(`Multiple subscriptions found for sub ${sub}. Returning the first one.`);
                const activeSubscriptions = subscriptionData.data.filter(s => s.status === 'active' || s.status === 'trialing');
                if (activeSubscriptions.length > 0) {
                    return activeSubscriptions[0];
                }
                console.warn(`No active or trialing subscriptions found for sub ${sub}. Returning the first subscription.`);
                return null
            }
            const subscription = subscriptionData.data[0]; //subscription.customer;
            //console.log(subscription)
            
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

