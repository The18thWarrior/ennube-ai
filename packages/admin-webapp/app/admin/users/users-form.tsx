// === users-form.tsx ===
// Created: 2025-08-30 13:15
// Purpose: Simple user edit form used in the admin users page

"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form"

const userSchema = z.object({
  name: z.string().max(255),
  firstName: z.string().min(1, "First Name is required").max(255),
  lastName: z.string().min(1, "Last Name is required").max(255),
  email: z.string().email("Invalid email address").max(255),
  role: z.string().max(255),
  password: z.string().max(255),
})

type FormData = z.infer<typeof userSchema>

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  user: any | null
  onSubmit: (data: FormData) => Promise<void>
  onResetPassword: (userId: string) => Promise<void>
}

export function UsersForm({ open, onOpenChange, user, onSubmit, onResetPassword }: Props) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = !!user

  const form = useForm<FormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", role: "", firstName: "", lastName: "", password: ""},
  })

  React.useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          name: user.name ?? "",
          email: user.email ?? "",
          role: user.app_metadata?.role ?? user.role ?? "",
          firstName: user.given_name ?? "",
          lastName: user.family_name ?? "",
        })
      } else {
        form.reset({ name: "", email: "", role: "", firstName: "", lastName: "", password: ""})
      }
    }
  }, [open, user, form])

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("UsersForm submit error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-300 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update user details." : "Enter new user details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {isEditing && <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" type="text" className={'border'} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />}

            {!isEditing && <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" type="text" className={'border'} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />}

            {!isEditing && <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" type="text" className={'border'} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email"  className={'border'} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter role" type="text" className={'border'} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter password"  className={'border'} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isEditing} onClick={() => { if (user?.user_id) onResetPassword(user.user_id) }}>
                {'Reset Password'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
