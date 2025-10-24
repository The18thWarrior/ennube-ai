'use client'
import CustomLink from "@/components/custom-link";
import { Button } from "@/components/ui/button"
import { useStripe } from "@/lib/stripe-context";


export default function UsageButton() {
  const { subscription, isLoadingSubscription, hasSubscription } = useStripe();
    
  return (
    <>
        {hasSubscription && (
            <CustomLink href="/dashboard" className="w-full">
              Usage
            </CustomLink>
        )}
    </>
  )
}
