// === page.tsx ===
// Created: 2025-10-18
// Purpose: Server page that renders the admin subscriptions UI and loads initial subscription list
import React from 'react'
import SubscriptionsClient from './client'
import { ManualSubscriptionRecord } from '@/lib/cache/subscription-cache'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import subscriptionCache from '@/lib/cache/subscription-cache'

export default async function AdminSubscriptionsPage() {
  // Require authenticated admin
  const session = await auth()
  if (!session || !session.user) {
    redirect('/login')
  }
  const userId = session.user.sub || session.user.id
  if (!userId || !isAdmin(userId)) {
    redirect('/')
  }

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO as string;

  let subs: ManualSubscriptionRecord[] = []
  try {
    subs = await subscriptionCache.listAll()
  } catch (err) {
    console.error('Failed to load subscriptions', err)
    subs = []
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1 className="text-xl font-semibold py-2">Manual Subscriptions</h1>
      <SubscriptionsClient initial={subs} priceId={priceId}/>
    </div>
  )
}

/*
 * === page.tsx ===
 * Updated: 2025-10-18
 * Summary: Server component that fetches subscription list and mounts the client UI for CRUD.
 */
