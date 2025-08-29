// === agent-settings-form.tsx ===
// Created: 2025-08-29 11:02
// Purpose: Form component for creating/editing agent settings
// Exports: AgentSettingsForm component
// Interactions: Used in agent settings admin page for CRUD operations

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
import type { AgentSettings, CreateAgentSettingsData, FrequencyType, ProviderType } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'

const schema = z.object({
  agent: z.string().min(1, 'Agent is required'),
  provider: z.enum(['sfdc', 'hubspot', 'gmail', 'msoffice'] as const),
  batch_size: z.number().min(1, 'Batch size must be at least 1'),
  active: z.boolean(),
  frequency: z.enum(['business_hours', 'daily', 'weekly', 'monthly'] as const)
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentSettings?: AgentSettings | null
  onSubmit: (data: CreateAgentSettingsData) => Promise<void>
}

export function AgentSettingsForm({ open, onOpenChange, agentSettings, onSubmit }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = !!agentSettings

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      agent: '',
      provider: 'sfdc',
      batch_size: 10,
      active: true,
      frequency: 'daily'
    }
  })

  React.useEffect(() => {
    if (open) {
      if (agentSettings) {
        form.reset({
          agent: agentSettings.agent || '',
          provider: agentSettings.provider || 'sfdc',
          batch_size: agentSettings.batch_size || 10,
          active: agentSettings.active ?? true,
          frequency: agentSettings.frequency || 'daily'
        })
      } else {
        form.reset({ agent: '', provider: 'sfdc', batch_size: 10, active: true, frequency: 'daily' })
      }
    }
  }, [open, agentSettings, form])

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        user_id: agentSettings?.user_id || 'system',
        agent: data.agent,
        batch_size: data.batch_size,
        active: data.active,
        frequency: data.frequency,
        provider: data.provider
      })
      onOpenChange(false)
      form.reset()
    } catch (err) {
      console.error('Form submit error:', err)
      // Could display toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-gray-300 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Agent Setting' : 'Create Agent Setting'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the agent configuration below.' : 'Enter the agent configuration below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="agent" render={({ field }) => (
              <FormItem>
                <FormLabel>Agent</FormLabel>
                <FormControl>
                  <Input placeholder="Agent name or identifier" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="provider" render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <FormControl>
                  <Input placeholder="Provider" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="batch_size" render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Size</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="frequency" render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="active" render={({ field }) => (
              <FormItem>
                <FormLabel>Active</FormLabel>
                <FormControl>
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/*
 * === agent-settings-form.tsx ===
 * Updated: 2025-08-29 11:02
 */
