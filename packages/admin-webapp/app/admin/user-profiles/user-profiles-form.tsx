// === user-profiles-form.tsx ===
// Created: 2025-08-29 10:45
// Purpose: Form component for creating/editing user profiles
// Exports: UserProfileForm component
// Interactions: Used in user profile admin page for CRUD operations
// Notes: Uses React Hook Form with validation

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
import type { UserProfile, CreateUserProfileData } from "@/lib/types"
import { getErrorMessage } from "@/lib/utils"

const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  company: z.string().min(1, "Company is required").max(255, "Company must be less than 255 characters"),
  job_role: z.string().min(1, "Job role is required").max(255, "Job role must be less than 255 characters"),
})

type FormData = z.infer<typeof userProfileSchema>

interface UserProfileFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userProfile?: UserProfile | null
  onSubmit: (data: CreateUserProfileData) => Promise<void>
}

export function UserProfileForm({ 
  open, 
  onOpenChange, 
  userProfile, 
  onSubmit 
}: UserProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = !!userProfile

  const form = useForm<FormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      job_role: "",
    },
  })

  // Reset form when dialog opens/closes or userProfile changes
  React.useEffect(() => {
    if (open) {
      if (userProfile) {
        form.reset({
          name: userProfile.name,
          email: userProfile.email,
          company: userProfile.company,
          job_role: userProfile.job_role,
        })
      } else {
        form.reset({
          name: "",
          email: "",
          company: "",
          job_role: "",
        })
      }
    }
  }, [open, userProfile, form])

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Form submission error:', error)
      // Handle error (could show toast notification)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-300 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit User Profile' : 'Create User Profile'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the user profile information below.' 
              : 'Enter the user profile information below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter full name" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="Enter email address" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter company name" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="job_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Role</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter job role/title" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (isEditing ? 'Updating...' : 'Creating...') 
                  : (isEditing ? 'Update' : 'Create')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/*
 * === user-profiles-form.tsx ===
 * Updated: 2025-08-29 10:45
 * Summary: Form component for user profile CRUD operations
 * Key Components:
 *   - UserProfileForm: Main form component with validation
 *   - userProfileSchema: Zod validation schema
 *   - Form handling with React Hook Form
 * Dependencies:
 *   - Requires: React Hook Form, Zod, UI components
 * Version History:
 *   v1.0 – initial form with validation
 * Notes:
 *   - Supports both create and edit modes
 *   - Includes comprehensive validation
 */
