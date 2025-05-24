'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Progress } from '@/components/ui/progress';
import { getSubscriptionLimit, useStripe } from '@/lib/stripe-context';
import { Button } from '@/components/ui/button';
import { useBillingUsage } from '@/hooks/useBillingUsage';

export default function UsageProgressBar() {
  const { data: session } = useSession();
  const { subscription, hasSubscription : isSubscribed } = useStripe();
  
  const limit = getSubscriptionLimit(subscription);
  // Use the new custom hook
  const { usage, loading, error, refreshing, refresh } = useBillingUsage();

  // Define the usage limit based on subscription status
  //const isSubscribed = subscription?.status === 'active' || subscription?.status === 'trialing';
  const usageLimit = limit;
  
  // Calculate the percentage of usage (capped at 100%)
  const usagePercentage = Math.min(100, (usage / usageLimit) * 100);

  if (loading && !refreshing) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Loading usage data...</span>
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={refresh}
              disabled={true}
            >
              <svg 
                className="h-4 w-4 animate-spin" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-red-500">{error}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={refresh}
            disabled={refreshing}
          >
            <svg 
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        <Progress value={0} className="h-2" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">Monthly Records Usage</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">{usage} / {usageLimit}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={refresh}
            disabled={refreshing}
          >
            <svg 
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>
      <Progress 
        value={usagePercentage} 
        className={`h-2 ${usagePercentage > 90 ? 'bg-red-100' : ''}`}
      />
      <p className="text-xs text-muted-foreground mt-1">
        {isSubscribed 
          ? "Premium plan: 1,000 record operations per month" 
          : "Free plan: 100 record operations per month"}
      </p>
      {usagePercentage > 90 && (
        <p className="text-xs text-red-500 mt-1">
          You're approaching your monthly limit! 
          {!isSubscribed && " Consider upgrading to Premium for increased limits."}
        </p>
      )}
    </div>
  );
}
