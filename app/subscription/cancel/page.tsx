'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SubscriptionCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">Subscription Cancelled</h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Your subscription process was cancelled. No charges have been made to your account.
      </p>
      <Link href="/">
        <Button>Return to Home</Button>
      </Link>
    </div>
  );
}
