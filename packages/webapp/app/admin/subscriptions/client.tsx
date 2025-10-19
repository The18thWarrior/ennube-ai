// === client.tsx ===
// Created: 2025-10-18
// Purpose: Client-side UI for listing and editing manual subscriptions in admin
'use client'
import React, { useEffect, useState } from 'react'
import type { ManualSubscriptionRecord } from '@/lib/cache/subscription-cache'
import { Input, Textarea } from '@/components/ui'

type Props = { initial: ManualSubscriptionRecord[], priceId: string }

export default function SubscriptionsClient({ initial, priceId }: Props) {
  const [items, setItems] = useState<ManualSubscriptionRecord[]>(initial || [])
  const SAMPLE_SUBSCRIPTION = JSON.stringify(
    {
      id: 'manual-sub-001',
      customer: 'manual-cust-001',
      status: 'active',
      days_until_due: 30,
      items: {
        data: [
          {
            id: 'si_manual_001',
            price: { id: priceId },
            quantity: 1,
          },
        ],
      },
    },
    null,
    2
  )

  const [subId, setSubId] = useState('')
  const [subscriptionText, setSubscriptionText] = useState(SAMPLE_SUBSCRIPTION)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => setItems(initial || []), [initial])

  async function reload() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscriptions')
      if (res.ok) {
        const json = await res.json()
        setItems(json || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault()
    if (!subId || !subscriptionText) return
    setLoading(true)
    try {
      // Try to parse subscription JSON to keep type fidelity on server
      let parsed
      try {
        parsed = JSON.parse(subscriptionText)
      } catch (err) {
        // If not JSON, store as a simple object with raw field
        parsed = { raw: subscriptionText }
      }

      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/subscriptions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subId, subscription: parsed }),
      })
      if (res.ok) {
        setSubId('')
        setSubscriptionText(SAMPLE_SUBSCRIPTION)
        setEditingId(null)
        await reload()
      } else {
        console.error('Failed to save subscription', await res.text())
      }
    } finally {
      setLoading(false)
    }
  }

  function edit(item: ManualSubscriptionRecord) {
    setSubId(item.subId)
    try {
      setSubscriptionText(JSON.stringify(item.subscription, null, 2))
    } catch {
      setSubscriptionText(String(item.subscription))
    }
    setEditingId(item.subId)
  }

  async function remove(id: string) {
    if (!confirm(`Delete subscription ${id}?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/subscriptions?subId=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) await reload()
      else console.error('Delete failed', await res.text())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 text-muted-foreground rounded">
      <h2 className="text-lg font-semibold mb-2">Manual Subscriptions</h2>

      <form onSubmit={save} className="mb-4 space-y-2">
        <div>
          <label className="block text-sm font-medium">Subscription ID (subId)</label>
          <Input type="text" value={subId} onChange={(e) => setSubId(e.target.value)} className="w-full border rounded p-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium">Subscription JSON</label>
          <Textarea value={subscriptionText} onChange={(e) => setSubscriptionText(e.target.value)} rows={8} className="w-full border rounded p-2 font-mono text-sm" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded" disabled={loading}>
            {editingId ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={() => { setSubId(''); setSubscriptionText(SAMPLE_SUBSCRIPTION); setEditingId(null) }} className="px-3 py-1 border rounded">Cancel</button>
          <button type="button" onClick={reload} className="px-3 py-1 border rounded" disabled={loading}>Reload</button>
        </div>
      </form>

      <div className="space-y-2">
        {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {items.length === 0 && <div className="text-sm text-muted-foreground">No subscriptions found.</div>}
        {items.map((it) => (
          <div key={it.subId} className="border rounded p-2 flex justify-between items-start">
            <div className="mr-4 break-words">
              <div className="font-mono text-sm text-muted-foreground">{it.subId}</div>
              <pre className="whitespace-pre-wrap text-sm mt-1 text-muted-foreground">{JSON.stringify(it.subscription, null, 2)}</pre>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => edit(it)} className="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 rounded">Edit</button>
              <button onClick={() => remove(it.subId)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/*
 * === client.tsx ===
 * Updated: 2025-10-18
 * Summary: Client component used by admin subscriptions page for CRUD operations.
 */
