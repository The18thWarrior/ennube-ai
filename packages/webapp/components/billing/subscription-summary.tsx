'use client';

import { useSession } from 'next-auth/react';
import { Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useStripe } from '@/lib/stripe-context';
import { useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import UsageProgressBar from '@/components/billing/usage-progress-bar';
//import { useSubscription } from '@/hooks/use-subscription';

export default function SubscriptionSummary() {
  const { data: session } = useSession();
  const { createCheckoutSession, isLoading, subscription, isLoadingSubscription, createPortalLink } = useStripe();
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

  const handleSubscribePro = async () => {
    const { url, error } = await createCheckoutSession(true);
    
    if (error) {
      console.error('Error creating checkout session:', error);
      return;
    }
    
    if (url) {
      window.location.href = url;
    }
  };

  const handleManageSubscription = async () => {
    if (!session?.user?.auth0?.sub) {
      console.error('No customer ID found');
      return;
    }
    const { url, error } = await createPortalLink();

    if (error) {
      console.error('Error creating portal link:', error);
      return;
    }
    
    if (url) {
      window.location.href = url;
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-background rounded-lg border border-border">
        <h3 className="text-lg font-medium mb-3">Sign in to manage your subscription</h3>
        <Link href="/api/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (isLoadingSubscription) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-background rounded-lg border border-border">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading subscription information...</p>
      </div>
    );
  }

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  return (
    <div className="flex flex-col max-w-xxl mx-auto px-6">
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
              
              {/* Usage Progress Bar */}
              <div className="mt-4 pt-4 border-t border-border">
                <Suspense fallback={<div>Loading usage data...</div>}>
                  <UsageProgressBar />
                </Suspense>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleManageSubscription}>Manage Subscription</Button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-center py-4">
              <h3 className="font-medium mb-2">You don't have an active subscription</h3>
              <p className="text-muted-foreground mb-4">
                Subscribe to get full access to all features
              </p>
              
              {/* Usage Progress Bar for free tier */}
              <div className="mb-6 px-2">
                <Suspense fallback={<div>Loading usage data...</div>}>
                  <UsageProgressBar />
                </Suspense>
              </div>
              <div className='flex justify-between items-top '>
                <div className="bg-card border w-full max-w-1/2 mx-4 border-border rounded-md p-4 mb-6">
                  <h3 className="font-semibold text-lg mb-2">Starter Plan</h3>
                  <p className="text-2xl font-bold mb-2">$199 <span className="text-muted-foreground text-sm font-normal">/month</span></p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      2 AI agents of your choice
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Standard support
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <strong>2,500 record operations</strong> per month (25x free tier)
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Basic analytics
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Email integration
                    </li>
                  </ul>
                </div>
                <div className="bg-card border w-full max-w-1/2 mx-4 border-border rounded-md p-4 mb-6">
                  <h3 className="font-semibold text-lg mb-2">Professional Plan</h3>
                  <p className="text-2xl font-bold mb-2">$549 <span className="text-muted-foreground text-sm font-normal">/month</span></p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      5 AI agents of your choice
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
                      <strong>25,000 record operations</strong> per month (5x starter tier)
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced analytics
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Email and calendar integration
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Custom workflows
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      API access
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className='flex justify-between items-top '>
                  <Button 
                    onClick={handleSubscribe} 
                    disabled={isLoading}
                    className="w-full mx-4"
                  >
                    {isLoading ? 'Loading...' : 'Subscribe Now'}
                  </Button>

                  <Button 
                    onClick={handleSubscribePro} 
                    disabled={isLoading}
                    className="w-full mx-4"
                  >
                    {isLoading ? 'Loading...' : 'Subscribe Now'}
                  </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}