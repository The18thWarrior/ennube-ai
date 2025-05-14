'use client';

import SubscriptionSummary from '@/components/billing/subscription-summary';
import { Suspense, useEffect } from 'react';

export default function SubscriptionPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionSummary />
    </Suspense>
  )
}