// === users-form.tsx ===
// Created: 2025-08-30 13:15
// Purpose: Simple user edit form used in the admin users page

'use client'

import * as React from 'react'

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  user: any | null
  onSubmit: (data: any) => Promise<void>
}

export function UsersForm({ open, onOpenChange, user, onSubmit }: Props) {
  const [formState, setFormState] = React.useState({ name: '', email: '', role: '' })
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (user) setFormState({ name: user.name ?? '', email: user.email ?? '', role: user.app_metadata?.role ?? '' })
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormState((s) => ({ ...s, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formState)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="p-4 bg-white shadow rounded">
      <h3 className="text-lg font-medium mb-2">Edit User</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block text-sm">Name</label>
          <input name="name" value={formState.name} onChange={handleChange} className="w-full border p-2" />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Email</label>
          <input name="email" value={formState.email} onChange={handleChange} className="w-full border p-2" />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Role</label>
          <input name="role" value={formState.role} onChange={handleChange} className="w-full border p-2" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="px-3 py-1 border">Cancel</button>
          <button type="submit" disabled={submitting} className="px-3 py-1 bg-blue-600 text-white">{submitting ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}
