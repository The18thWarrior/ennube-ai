// === embed-metadata.tsx ===
// Created: 2025-09-02
// Purpose: Button to trigger embedding metadata via POST /api/salesforce/embed
// Exports:
//  - EmbedMetadataButton
// Notes: Client component — shows loading state and uses notistack for toasts

'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
// import Link from 'next/link' (not used)
import { useSnackbar } from 'notistack'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface EmbedMetadataButtonProps {
  instanceUrl?: string;
}

export const EmbedMetadataButton: React.FC<EmbedMetadataButtonProps> = ({ instanceUrl }) => {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [describeLoading, setDescribeLoading] = useState(false)
  const [embedLoading, setEmbedLoading] = useState(false)
  const [describeResults, setDescribeResults] = useState<Array<any>>([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Record<string, {apiName: string, selected: boolean}>>({})
  const { enqueueSnackbar } = useSnackbar()

  // Derived helpers for visible (filtered) items
  const visibleNames = describeResults.filter(s => {
    if (!filter) return true
    const q = filter.toLowerCase()
    const name = String(s?.name || '').toLowerCase()
    const label = String(s?.label || '').toLowerCase()
    return name.includes(q) || label.includes(q)
  }).map((s: any) => s?.name).filter(Boolean)

  const allVisibleSelected = visibleNames.length > 0 && visibleNames.every(n => !!selected[n]?.selected)

  const toggleSelectAll = (val?: boolean) => {
    const makeSelected = typeof val === 'boolean' ? val : !allVisibleSelected
    setSelected(prev => {
      const next = { ...prev }
      visibleNames.forEach((name) => {
        next[name] = { apiName: name, selected: makeSelected }
      })
      return next
    })
  }

  // Open the modal and fetch describe results
  const handleOpen = async () => {
    setOpen(true)
    // fetch describe when opening
    setDescribeLoading(true)
    try {
      const res = await fetch('/api/salesforce/describe')
      if (!res.ok) {
        const text = await res.text()
        enqueueSnackbar(`Failed to fetch describe: ${text || res.statusText}`, { variant: 'error' })
        setDescribeResults([])
        return
      }
      const data = await res.json()
      console.log(`Describe data:`, data)
      // Expect DescribeGlobalResult with `sobjects` array
      const list = Array.isArray(data?.objectResult) ? data.objectResult : []
      setDescribeResults(list)
      // reset selection
      const sel: Record<string, {apiName: string, selected: boolean}> = {}
      list.forEach((s: any) => { if (s?.name) sel[s.name] = { apiName: s.name, selected: false } })
      setSelected(sel)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      enqueueSnackbar(`Error fetching describe: ${msg}`, { variant: 'error' })
      setDescribeResults([])
    } finally {
      setDescribeLoading(false)
    }
  }

  const handleSubmitEmbed = async () => {
    const names = Object.entries(selected).filter(([, v]) => !!v.selected).map(([k]) => k)
    if (names.length === 0) {
      enqueueSnackbar('Please select at least one sObject to embed', { variant: 'warning' })
      return
    }
    setEmbedLoading(true)
    try {
      const res = await fetch('/api/salesforce/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sobjects: names })
      })
      if (!res.ok) {
        const text = await res.text()
        enqueueSnackbar(`Failed to embed metadata: ${text || res.statusText}`, { variant: 'error' })
        return
      }
      enqueueSnackbar('Embed metadata completed', { variant: 'success' })
      setOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      enqueueSnackbar(`Error embedding metadata: ${msg}`, { variant: 'error' })
    } finally {
      setEmbedLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2 text-center" onClick={handleOpen}>
        {loading || describeLoading ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m0-4a8 8 0 110 16v-4" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        )}
        <span>{describeLoading ? 'Loading sObjects...' : 'Embed Metadata'}</span>
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (v) handleOpen(); setOpen(v) }}>
        <DialogContent className="max-w-3xl p-4">
          <DialogHeader>
            <DialogTitle>Embed Salesforce Metadata</DialogTitle>
          </DialogHeader>

          <div className="mt-3">
            <Input placeholder="Filter sObjects by name or label" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox checked={allVisibleSelected} onCheckedChange={() => toggleSelectAll()} />
              <span className="text-sm">Select all</span>
            </div>
            <div className="h-72">
            {describeLoading ? (
              <div className="flex items-center justify-center h-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m0-4a8 8 0 110 16v-4" />
                </svg>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 gap-2">
                  {describeResults.filter(s => {
                    if (!filter) return true
                    const q = filter.toLowerCase()
                    const name = String(s?.name || '').toLowerCase()
                    const label = String(s?.label || '').toLowerCase()
                    return name.includes(q) || label.includes(q)
                  }).map((s: any) => (
                    <label key={s.name} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                      <Checkbox checked={!!selected[s.name]?.selected} onCheckedChange={(v) => setSelected(prev => ({ ...prev, [s.name]: { apiName: s.name, selected: !!v } }))} />
                      <div className="flex flex-col">
                        <span className="font-medium">{s.label || s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.name}</span>
                      </div>
                    </label>
                  ))}
                  {describeResults.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">No sObjects found</div>
                  )}
                </div>
              </ScrollArea>
            )}
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={embedLoading}>Close</Button>
              <Button onClick={handleSubmitEmbed} disabled={embedLoading}>
                {embedLoading ? 'Embedding...' : 'Embed Selected'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EmbedMetadataButton

/*
 * === embed-metadata.tsx ===
 * Updated: 2025-09-02
 * Summary: Client button to trigger /api/salesforce/embed and show status via notistack
 */
