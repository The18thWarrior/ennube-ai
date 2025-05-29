import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil', // Use the latest API version,
  typescript: true,
});
export async function getCustomerSubscription (sub: string) {
    try {
      const query = `status:'active' AND metadata['sub']:'${sub}'`;
      //console.log(query);
      //console.log()
        const subscriptionData = await stripe.subscriptions.search({
            query
        });
        //onsole.log(subscriptionData);
        if (subscriptionData.data.length > 0) {
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