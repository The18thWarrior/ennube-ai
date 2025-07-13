'use client';

import { useSession } from 'next-auth/react';
import Stripe from 'stripe';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface StripeContextType {
  createCheckoutSession: (pro?: boolean) => Promise<{ url: string | null; error: string | null }>;
  createPortalLink: () => Promise<{ url: string | null; error: string | null }>;
  isLoading: boolean;
  subscription: SubscriptionStatus | null;
  limit: number;
  isPro: boolean;
  isPrimary: boolean;
  isLoadingSubscription: boolean;
  hasSubscription: boolean;
  licenseCount: number;
  refetchSubscription: () => Promise<void>;
}

interface SubscriptionStatus {
  id: string;
  customer: string;
  items? : {
    data: Stripe.SubscriptionItem[]
  },
  days_until_due?: number;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid';
}


const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isPrimary, setIsPrimary] = useState(false);
  const [licenseCount, setLicenseCount] = useState(0);
  const [limit, setLimit] = useState(10); // Default limit
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  const createCheckoutSession = async (pro = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stripe/checkout?pro=${pro}`, {
        method: 'GET',
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
        //console.log('Fetched subscription data:', data);
        setSubscription(data.subscription);
        setIsPrimary(data.isPrimary);
        const parsedLimits = getSubscriptionLimit(data.subscription);
        setIsPro(parsedLimits.isPro);
        setLimit(parsedLimits.usageLimit);
        setLicenseCount(parsedLimits.licenseCount);
      } else {
        // If no subscription is found, set default state
        setSubscription({ customer: '', status: 'incomplete', id: '' });
        setIsPrimary(true);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription({ customer: '', status: 'incomplete', id: '' });
      setIsPrimary(true);
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
    isPro,
    limit,
    isLoadingSubscription,
    hasSubscription,
    licenseCount,
    isPrimary,
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

export function getSubscriptionLimit(subscription: SubscriptionStatus | null): {
  usageLimit: number;
  isPro: boolean;
  isSubscribed: boolean;
  licenseCount: number;
} {
  if (!subscription) return { usageLimit: 100, isPro: false, isSubscribed: false, licenseCount: 0 };
  const isSubscribed = getIsSubscribed(subscription);
  const isPro = getIsPro(subscription);
  const usageLimit = isSubscribed ? (isPro ? 25000 : 2500) : 100;
  const licenseCount = subscription.items?.data[0]?.quantity || 0;

  return {
    usageLimit,
    isPro,
    isSubscribed,
    licenseCount
  };
}

function getIsPro(subscription: SubscriptionStatus | null): boolean {
  if (!subscription || !subscription.items || !subscription.items.data) return false;
  //console.log('Checking if user is Pro:', subscription);
  const isPro = subscription.items.data.some(item => {
    if (!item.price || !item.price.id) return false;
    return item.price?.id === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
  });
  return isPro;
}

function getIsSubscribed(subscription: SubscriptionStatus | null): boolean {
  if (!subscription) return false;

  const status = subscription.status;
  return status === 'active' || status === 'trialing';
}