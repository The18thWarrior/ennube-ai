'use client';

import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface StripeContextType {
  createCheckoutSession: (pro?: boolean) => Promise<{ url: string | null; error: string | null }>;
  createPortalLink: () => Promise<{ url: string | null; error: string | null }>;
  isLoading: boolean;
  subscription: SubscriptionStatus | null;
  isLoadingSubscription: boolean;
  hasSubscription: boolean;
  refetchSubscription: () => Promise<void>;
}

interface SubscriptionStatus {
  id: string;
  customer: string;
  days_until_due?: number;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid';
}


const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  const createCheckoutSession = async (pro = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stripe/checkout?pro=${pro}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      return { url: data.url, error: null };
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      return { url: null, error: error.message || 'Something went wrong' };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    if (!session?.user) {
      setIsLoadingSubscription(false);
      return;
    }

    try {
      const response = await fetch('/api/stripe/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        // If no subscription is found, set default state
        setSubscription({ customer: '', status: 'incomplete', id: '' });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription({ customer: '', status: 'incomplete', id: '' });
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const createPortalLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(data);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal link');
      }

      return { url: data.url, error: null };
    } catch (error: any) {
      console.error('Error creating portal link:', error);
      return { url: null, error: error.message || 'Something went wrong' };
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (session) fetchSubscriptionStatus();
  }, [session]);
  const hasSubscription = !!(subscription && (subscription.status === 'active' || subscription.status === 'trialing'));
  const value = {
    createCheckoutSession,
    createPortalLink,
    isLoading,
    subscription,
    isLoadingSubscription,
    hasSubscription,
    refetchSubscription: fetchSubscriptionStatus
  } as StripeContextType;
  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}

export function getSubscriptionLimit(subscription: SubscriptionStatus | null): number {
  if (!subscription) return 100;
    const usageLimit = getIsSubscribed(subscription) ? 1000 : 100;

  return usageLimit;
}

export function getIsSubscribed(subscription: SubscriptionStatus | null): boolean {
  if (!subscription) return false;

  const status = subscription.status;
  return status === 'active' || status === 'trialing';
}