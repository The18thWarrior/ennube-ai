// === route.ts ===
// Created: 2025-09-16 14:05
// Purpose: API route for admin prompt CRUD backed by lib/cache/prompt-cache.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAllPrompts, getPrompt, setPrompt, deletePrompt } from '@/lib/cache/prompt-cache'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user.sub || session?.user?.id
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const prompts = await getAllPrompts()
    return NextResponse.json(prompts)
  } catch (err) {
    console.error('GET /api/admin/prompts error', err)
    return NextResponse.json({ error: 'Failed to list prompts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user.sub || session?.user?.id
    if (!userId || !isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { agent, prompt } = body || {}
    if (!agent || !prompt) return NextResponse.json({ error: 'agent and prompt required' }, { status: 400 })
    await setPrompt(agent, prompt)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/admin/prompts error', err)
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user.sub || session?.user?.id
    if (!userId || !isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { agent, prompt } = body || {}
    if (!agent || !prompt) return NextResponse.json({ error: 'agent and prompt required' }, { status: 400 })
    // Upsert using setPrompt
    await setPrompt(agent, prompt)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PUT /api/admin/prompts error', err)
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user.sub || session?.user?.id
    if (!userId || !isAdmin(userId)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { agent } = body || {}
    if (!agent) return NextResponse.json({ error: 'agent required' }, { status: 400 })
    await deletePrompt(agent)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/prompts error', err)
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 })
  }
}

/*
 * === route.ts ===
 * Updated: 2025-09-16 14:05
 */
