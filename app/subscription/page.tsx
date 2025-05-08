'use client';

import { useSession } from 'next-auth/react';
import { Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useStripe } from '@/lib/stripe-context';
import { useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
//import { useSubscription } from '@/hooks/use-subscription';

function SubscriptionPage() {
  const { data: session } = useSession();
  const { createCheckoutSession, isLoading, subscription, isLoadingSubscription } = useStripe();
  //const { subscription, isLoadingSubscription, refetchSubscription } = useSubscription();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      enqueueSnackbar(errorParam, { 
        variant: 'error',
        preventDuplicate: true
      });
    }
  }, [searchParams, enqueueSnackbar]);

  const handleSubscribe = async () => {
    const { url, error } = await createCheckoutSession();
    
    if (error) {
      console.error('Error creating checkout session:', error);
      return;
    }
    
    if (url) {
      window.location.href = url;
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <h1 className="text-2xl font-bold mb-4">Sign in to manage your subscription</h1>
        <Link href="/api/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (isLoadingSubscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <h1 className="text-2xl font-bold mb-4">Loading subscription information...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  return (
    <div className="flex flex-col max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription Status</h1>
      
      <div className="bg-background rounded-lg border border-border p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Plan</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </div>
        </div>

        {isActive ? (
          <>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{subscription?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{subscription?.status}</span>
              </div>
              {subscription?.days_until_due && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days until due</span>
                  <span className="font-medium">
                    {subscription.days_until_due}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline">Manage Subscription</Button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-center py-4">
              <h3 className="font-medium mb-2">You don't have an active subscription</h3>
              <p className="text-muted-foreground mb-4">
                Subscribe to get full access to all features
              </p>
              
              <div className="bg-card border border-border rounded-md p-4 mb-6">
                <h3 className="font-semibold text-lg mb-2">Premium Plan</h3>
                <p className="text-2xl font-bold mb-2">$9.99 <span className="text-muted-foreground text-sm font-normal">/month</span></p>
                <ul className="text-sm space-y-2 mb-4">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Full access to all features
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    No usage limits
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={handleSubscribe} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Loading...' : 'Subscribe Now'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionPage />
    </Suspense>
  )
}