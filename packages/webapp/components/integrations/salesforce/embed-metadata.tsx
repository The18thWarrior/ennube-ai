// === embed-metadata.tsx ===
// Created: 2025-09-02
// Purpose: Button to trigger embedding metadata via POST /api/salesforce/embed
// Exports:
//  - EmbedMetadataButton
// Notes: Client component — shows loading state and uses notistack for toasts

'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSnackbar } from 'notistack'

interface EmbedMetadataButtonProps {
  instanceUrl?: string;
}

export const EmbedMetadataButton: React.FC<EmbedMetadataButtonProps> = ({ instanceUrl }) => {
  const [loading, setLoading] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/salesforce/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!res.ok) {
        const text = await res.text()
        enqueueSnackbar(`Failed to embed metadata: ${text || res.statusText}`, { variant: 'error' })
        setLoading(false)
        return
      }

      const data = await res.json().catch(() => null)
      enqueueSnackbar('Embed metadata completed', { variant: 'success' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      enqueueSnackbar(`Error embedding metadata: ${msg}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2 text-center">
      <Link href="#" onClick={handleClick} className="flex flex-col items-center justify-center gap-2 w-full">
        {loading ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m0-4a8 8 0 110 16v-4" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        )}
        <span>{loading ? 'Embedding metadata...' : 'Embed Metadata'}</span>
      </Link>
    </Button>
  )
}

export default EmbedMetadataButton

/*
 * === embed-metadata.tsx ===
 * Updated: 2025-09-02
 * Summary: Client button to trigger /api/salesforce/embed and show status via notistack
 */
