'use client'
import { useState } from "react";
import CustomLink from "@/components/custom-link";
import { Button } from "@/components/ui/button"
import { useStripe } from "@/lib/stripe-context";
import { Loader2 } from "lucide-react";
import { useSnackbar } from 'notistack';
import { useBillingUsage } from "@/hooks/useBillingUsage";
import { useRouter } from "next/navigation";

export default function ProspectFinderExecuteButton() {
  const { subscription, isLoadingSubscription, hasSubscription, limit } = useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { usage } = useBillingUsage();
  const exceededLimit = usage >= limit;
  const route = useRouter();

  const handleExecute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      // Call the data-steward API with a default limit of 100
      const response = await fetch('/api/agents/prospect-finder?limit=1');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute dat`a steward agent');
      }
      
      const data = await response.json();
      setResult(data);
      
      // Display success toast message
      enqueueSnackbar('Prospect Finder started', { 
        variant: 'success',
        autoHideDuration: 4000
      });
      route.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error executing prospect finder:', err);
    } finally {
      setIsLoading(false);
    }
  };
    
  return (
    <div className="space-y-4">
      <Button 
        onClick={handleExecute} 
        disabled={isLoading || exceededLimit} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Find Prospects'
        )}
      </Button>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Error: {error}
        </div>
      )}
      
    </div>
  )
}
