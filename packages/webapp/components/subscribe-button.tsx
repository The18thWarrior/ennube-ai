'use client';

import { useStripe } from '@/lib/stripe-context';
import { Button } from './ui/button';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';

export function SubscribeButton() {
  const { data: session } = useSession()
  const { createCheckoutSession, isLoading } = useStripe();

  const handleSubscribe = async () => {
    if (!session) {
      // Redirect to sign in if not authenticated
      window.location.href = '/api/auth/signin';
      return;
    }

    // Redirect to subscription page instead of directly to checkout
    window.location.href = '/subscription';
  };

  return (
    <Button 
      onClick={handleSubscribe} 
      variant="outline" 
      size="sm" 
      className="ml-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        'Subscribe'
      )}
    </Button>
  );
}
