'use client';

import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ProfileInformation from '@/components/account/profile-information';
import SubscriptionSummary from '@/components/billing/subscription-summary';
import { useStripe } from '@/lib/stripe-context';
import { Suspense } from 'react';
import UsageProgressBar from '@/components/billing/usage-progress-bar';
import { useUser } from '@auth0/nextjs-auth0';

export default function AccountPage() {
  const { user, isLoading } = useUser();

  const { isPrimary } = useStripe();
  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <h1 className="text-2xl font-bold mb-4">Sign in to view your account</h1>
        <Link href="/api/auth/signin">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div >
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and subscription
        </p>
      </div>

      {/* Grid layout for side-by-side components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile Information Section */}
        <div className="flex flex-col">
          <div className="flex-grow">
            <ProfileInformation />
          </div>
        </div>

        {/* Account Summary Section */}
        <div className="flex flex-col">
          {/* <h2 className="text-xl font-semibold mb-4">Account Summary</h2> */}
          <div className="flex-grow">
            {isPrimary && <SubscriptionSummary />}
            {!isPrimary && 
              <div className="bg-background rounded-lg border border-border p-6 mb-6">
                <Suspense fallback={<div>Loading usage data...</div>}>
                  <UsageProgressBar />
                </Suspense>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
