// === contract-results-form.tsx ===
// Created: 2025-08-29 11:07
// Purpose: Form component for creating/editing contract_results
// Exports: ContractResultsForm component

'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { ContractResult, CreateContractResultData } from '@/lib/types'

const schema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  source_id: z.string().min(1, 'Source ID is required'),
  provider: z.string().min(1, 'Provider is required'),
  contract_data: z.string().optional()
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractResult?: ContractResult | null
  onSubmit: (data: CreateContractResultData) => Promise<void>
}

export function ContractResultsForm({ open, onOpenChange, contractResult, onSubmit }: Props) {
  const isEditing = !!contractResult
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { user_id: '', source_id: '', provider: '', contract_data: '' }
  })

  React.useEffect(() => {
    if (open) {
      if (contractResult) {
        form.reset({
          user_id: contractResult.user_id,
          source_id: contractResult.source_id,
          provider: contractResult.provider,
          contract_data: JSON.stringify(contractResult.contract_data || {})
        })
      } else {
        form.reset({ user_id: '', source_id: '', provider: '', contract_data: '' })
      }
    }
  }, [open, contractResult, form])

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const payload: CreateContractResultData = {
        user_id: data.user_id,
        source_id: data.source_id,
        provider: data.provider,
        contract_data: data.contract_data ? JSON.parse(data.contract_data) : {}
      }

      await onSubmit(payload)
      onOpenChange(false)
      form.reset()
    } catch (err) {
      console.error('Submit error', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gray-300 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Contract Result' : 'Create Contract Result'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the contract result' : 'Enter new contract result details'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="User ID" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Source ID" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Provider" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Data (JSON)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='{"key": "value"}' disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/*
 * === contract-results-form.tsx ===
 */
