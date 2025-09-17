// === client.tsx ===
// Created: 2025-09-16 14:00
// Purpose: Client-side UI for creating and editing agent prompts in admin/prompts
'use client'
import { Textarea } from '@/components/ui'
import React, { useEffect, useState } from 'react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

type Prompt = {
  agent: string
  prompt: string
}

export default function PromptsClient({ initial }: { initial: Prompt[] }) {
  const [prompts, setPrompts] = useState<Prompt[]>(initial || [])
  const [agent, setAgent] = useState('')
  const [promptText, setPromptText] = useState('')
  const [editingAgent, setEditingAgent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPrompts(initial || [])
  }, [initial])

  async function reload() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/prompts')
      if (res.ok) {
        const json = await res.json()
        setPrompts(json || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault()
    if (!agent || !promptText) return
    setLoading(true)
    try {
      const method = editingAgent ? 'PUT' : 'POST'
      const url = '/api/admin/prompts'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, prompt: promptText }),
      })
      if (res.ok) {
        setAgent('')
        setPromptText('')
        setEditingAgent(null)
        await reload()
      } else {
        console.error('Failed to save prompt', await res.text())
      }
    } finally {
      setLoading(false)
    }
  }

  async function edit(p: Prompt) {
    setAgent(p.agent)
    setPromptText(p.prompt)
    setEditingAgent(p.agent)
  }

  async function remove(agentToDelete: string) {
    if (!confirm(`Delete prompt for agent "${agentToDelete}"?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentToDelete }),
      })
      if (res.ok) await reload()
      else console.error('Delete failed', await res.text())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded">
      <h2 className="text-lg font-semibold mb-2">Agent Prompts</h2>

      <form onSubmit={save} className="mb-4 space-y-2">
        <div>
          <label className="block text-sm font-medium">Agent</label>
          <input
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-700 rounded p-2 text-sm placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Prompt</label>
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-700 rounded p-2 font-mono text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
            disabled={loading}
          >
            {editingAgent ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAgent('');
              setPromptText('');
              setEditingAgent(null);
            }}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={reload}
            className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
            disabled={loading}
          >
            Reload
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {prompts.length === 0 && <div className="text-sm text-gray-500">No prompts found.</div>}
        {prompts.map((p) => (
          <div
            key={p.agent}
            className="border border-gray-200 dark:border-gray-800 rounded p-2 flex justify-between items-start bg-white dark:bg-gray-800"
          >
            <div className="mr-4 break-words">
              <div className="font-mono text-sm text-gray-700 dark:text-gray-200">{p.agent}</div>
              <Collapsible>
                <div className="overflow-hidden">
                  <div className="h-20 overflow-hidden">
                    <pre className="whitespace-pre-wrap text-sm mt-1 text-gray-800 dark:text-gray-100">{p.prompt}</pre>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="mt-2">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">{p.prompt}</pre>
                  </div>
                </CollapsibleContent>
                <div className="mt-2">
                  <CollapsibleTrigger asChild>
                    <button className="text-sm text-blue-600 dark:text-blue-400">Show more</button>
                  </CollapsibleTrigger>
                </div>
              </Collapsible>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => edit(p)} className="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 rounded">Edit</button>
              <button onClick={() => remove(p.agent)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/*
 * === client.tsx ===
 * Updated: 2025-09-16 14:00
 * Summary: Client component used by admin prompts page for CRUD operations.
 */
