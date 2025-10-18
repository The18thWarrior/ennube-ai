// === page.tsx ===
// Created: 2025-09-16 14:00
// Purpose: Server page that renders the admin prompts UI and loads initial prompt list from cache
import React from 'react'
import PromptsClient from './client'
import { getAllPrompts, Prompt as PromptType } from '@/lib/cache/prompt-cache'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'

export default async function AdminPromptsPage() {
  // Require authenticated admin
  const session = await auth()
  const userId = session?.user.sub || session?.user.id
  if (!userId || !isAdmin(userId)) {
    // Redirect non-admins to the main admin landing or home
    redirect('/')
  }

  let prompts: PromptType[] = []
  try {
    prompts = await getAllPrompts()
  } catch (err) {
    console.error('Failed to load prompts', err)
    prompts = []
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1 className="text-xl font-semibold py-2">Prompts</h1>
      <PromptsClient initial={prompts} />
    </div>
  )
}

/*
 * === page.tsx ===
 * Updated: 2025-09-16 14:00
 * Summary: Server component that fetches prompt list and mounts the client UI for CRUD.
 */
