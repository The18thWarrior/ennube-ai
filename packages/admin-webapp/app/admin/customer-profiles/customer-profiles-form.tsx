// === customer-profiles-form.tsx ===
// Created: 2025-08-29 11:22
// Purpose: Form component for creating/editing customer profiles
// Exports: CustomerProfilesForm component
// Interactions: Used in customer profile admin page for CRUD operations
// Notes: Uses React Hook Form with simple validation

'use client'

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
import type { CustomerProfile, CreateCustomerProfileData } from "#/lib/types"

const customerProfileSchema = z.object({
  customer_profile_name: z.string().min(1, "Name is required").max(255),
  common_industries: z.string().min(1, "Common industries required"),
  frequently_purchased_products: z.string().min(1, "Products required"),
  geographic_regions: z.string().min(1, "Regions required")
})

type FormData = z.infer<typeof customerProfileSchema>

interface CustomerProfilesFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerProfile?: CustomerProfile | null
  onSubmit: (data: CreateCustomerProfileData) => Promise<void>
}

export function CustomerProfilesForm({ 
  open, 
  onOpenChange, 
  customerProfile, 
  onSubmit 
}: CustomerProfilesFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditing = !!customerProfile

  const form = useForm<FormData>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: {
      customer_profile_name: "",
      common_industries: "",
      frequently_purchased_products: "",
      geographic_regions: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      if (customerProfile) {
        form.reset({
          customer_profile_name: customerProfile.customer_profile_name,
          common_industries: customerProfile.common_industries,
          frequently_purchased_products: customerProfile.frequently_purchased_products,
          geographic_regions: customerProfile.geographic_regions,
        })
      } else {
        form.reset({
          customer_profile_name: "",
          common_industries: "",
          frequently_purchased_products: "",
          geographic_regions: "",
        })
      }
    }
  }, [open, customerProfile, form])

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const payload: CreateCustomerProfileData = {
        user_id: customerProfile?.user_id || 'system',
        active: customerProfile?.active ?? true,
        customer_profile_name: data.customer_profile_name,
        common_industries: data.common_industries,
        frequently_purchased_products: data.frequently_purchased_products,
        geographic_regions: data.geographic_regions
      }

      await onSubmit(payload)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gray-300 dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Customer Profile' : 'Create Customer Profile'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the customer profile information below.' 
              : 'Enter the customer profile information below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_profile_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Profile name" 
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
              name="common_industries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Common Industries</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Healthcare, Finance" 
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
              name="frequently_purchased_products"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequently Purchased Products</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="List commonly purchased products" 
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
              name="geographic_regions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geographic Regions</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. North America, EMEA" 
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
 * === customer-profiles-form.tsx ===
 * Updated: 2025-08-29 11:22
 */
