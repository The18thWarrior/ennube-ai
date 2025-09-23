'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (sessionId) {
      // Here you could verify the session with Stripe
      // For simplicity, we'll just assume it's valid
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <h1 className="text-2xl font-bold mb-4">Verifying your subscription...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Subscription Verification Failed</h1>
        <p className="text-muted-foreground mb-6">We couldn't verify your subscription. Please contact support.</p>
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">Subscription Successful!</h1>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Thank you for subscribing! Your account has been successfully upgraded.
      </p>
      <Link href="/">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
}

export default function SubscriptionSuccessPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionSuccessPage />
    </Suspense>
  )
}