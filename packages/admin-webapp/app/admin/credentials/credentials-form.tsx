// === credentials-form.tsx ===
// Created: 2025-08-29 11:12
// Purpose: Form component for creating/editing credentials
// Exports: CredentialsForm component

'use client'

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { Credential, CreateCredentialData } from "@/lib/types"
import { getErrorMessage } from "@/lib/utils"

const schema = z.object({
  user_id: z.string().min(1),
  type: z.string().min(1),
  access_token: z.string().min(1),
  instance_url: z.string().min(1),
  refresh_token: z.string().optional(),
  user_info_display_name: z.string().optional(),
  user_info_email: z.string().optional(),
  expires_at: z.number()
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  credential?: Credential | null
  onSubmit: (data: CreateCredentialData) => Promise<void>
}

export function CredentialsForm({ open, onOpenChange, credential, onSubmit }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = !!credential

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { user_id: '', type: '', access_token: '', instance_url: '', refresh_token: '', user_info_display_name: '', user_info_email: '', expires_at: Date.now() + 1000 * 60 * 60 * 24 } })

  React.useEffect(() => {
    if (open) {
      if (credential) {
        form.reset({
          user_id: credential.user_id,
          type: credential.type,
          access_token: credential.access_token,
          instance_url: credential.instance_url,
          refresh_token: credential.refresh_token || '',
          user_info_display_name: credential.user_info_display_name || '',
          user_info_email: credential.user_info_email || '',
          expires_at: credential.expires_at || Date.now()
        })
      } else {
        form.reset({ user_id: '', type: '', access_token: '', instance_url: '', refresh_token: '', user_info_display_name: '', user_info_email: '', expires_at: Date.now() + 1000 * 60 * 60 * 24 })
      }
    }
  }, [open, credential, form])

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      // Ensure the payload matches CreateCredentialData shape and types
      const payload: CreateCredentialData = {
        user_id: data.user_id,
        type: data.type as any,
        access_token: data.access_token,
        instance_url: data.instance_url,
        refresh_token: data.refresh_token || undefined,
        user_info_id: undefined,
        user_info_organization_id: undefined,
        user_info_display_name: data.user_info_display_name || undefined,
        user_info_email: data.user_info_email || undefined,
        user_info_organization_id_alt: undefined,
        account_timestamp_field: undefined,
        expires_at: Number(data.expires_at)
      }

      await onSubmit(payload)
      onOpenChange(false)
      form.reset()
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gray-300 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Credential' : 'Create Credential'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Update credential details.' : 'Enter credential details.'}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="user_id" render={({ field }) => (
              <FormItem>
                <FormLabel>User ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Auth0 user sub id" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="sfdc | hubspot | gsuite | postgres" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="access_token" render={({ field }) => (
              <FormItem>
                <FormLabel>Access Token</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Access token" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="instance_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Instance URL</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://..." disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="user_info_display_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Integration display name" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="user_info_email" render={({ field }) => (
              <FormItem>
                <FormLabel>User Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="user@example.com" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="expires_at" render={({ field }) => (
              <FormItem>
                <FormLabel>Expires At (ms)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled={isSubmitting} />
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
