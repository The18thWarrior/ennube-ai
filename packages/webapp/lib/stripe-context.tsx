'use client';

import { useSession } from 'next-auth/react';
import Stripe from 'stripe';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SubscriptionStatus } from './types';
import { getSubscriptionLimit } from './utils';

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
      console.log('Error creating checkout session:', error);
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
      console.log('Error fetching subscription:', error);
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
      console.log('Error creating portal link:', error);
      return { url: null, error: error.message || 'Something went wrong' };
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (session?.user?.auth0?.sub && subscription === null) fetchSubscriptionStatus();
  }, [session?.user]);
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
