"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { CrmDataLoaderCard } from './crm-data-loader-card'

interface CrmDataLoaderModalProps {
  records?: Array<Record<string, any>>
  onComplete?: (result: any) => void
  triggerLabel?: string
  triggerClassName?: string
}

export function CrmDataLoaderModal({ records, onComplete, triggerLabel = 'Open Data Loader', triggerClassName }: CrmDataLoaderModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName} variant='ghost' size="sm">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl p-0 overflow-auto max-h-[90vh]" style={{scrollbarWidth: 'none'}}>
        <DialogTitle className="text-lg font-semibold hidden">
          Data Loader
        </DialogTitle>
        <div className="relative">
          {/* Close button */}
          {/* <button
            className="absolute top-4 right-4 z-10 rounded-full p-2 hover:bg-muted transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Close"
            type="button"
          >
            <X className="h-5 w-5" />
          </button> */}
          <CrmDataLoaderCard
            records={records}
            onComplete={(result) => {
              setOpen(false)
              onComplete?.(result)
            }}
            borderless={true} // Pass borderless prop to remove card border
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
