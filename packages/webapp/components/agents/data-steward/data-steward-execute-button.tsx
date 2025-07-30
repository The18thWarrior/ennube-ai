'use client'
import { useState } from "react";
import CustomLink from "@/components/custom-link";
import { Button } from "@/components/ui/button"
import { useStripe } from "@/lib/stripe-context";
import { ChevronDown, Loader2 } from "lucide-react";
import { useSnackbar } from 'notistack';
import { useBillingUsage } from "@/hooks/useBillingUsage";
import { useRouter } from "next/navigation";
import useIntegrationConnections from "@/hooks/useIntegrationConnections";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DataStewardExecuteButton() {
  const { subscription, isLoadingSubscription, hasSubscription, limit } = useStripe();
  const { 
      connections, 
      error: connectionsError
  } = useIntegrationConnections();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { usage } = useBillingUsage();
  const exceededLimit = usage >= limit;
  const route = useRouter();
  const hasSalesforceConnection = connections['sfdc'];
  const hasHubspotConnection = connections['hubspot'];

  const handleExecute = async (provider: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      // Call the data-steward API with a default limit of 100
      const response = await fetch(`/api/agents/data-steward?limit=10&provider=${provider}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute dat`a steward agent');
      }
      
      const data = await response.json();
      setResult(data);
      
      // Display success toast message
      enqueueSnackbar('Data Steward started', { 
        variant: 'success',
        autoHideDuration: 4000
      });
      route.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error executing data steward agent:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeSFDC = async () => {
    await handleExecute('sfdc');
  }
  const executeHubspot = async () => {
    await handleExecute('hubspot');
  }

  // Check if we have at least one connection
  const noConnections = !hasSalesforceConnection && !hasHubspotConnection;

  return (
    <div className="space-y-4">
      {noConnections ? (
        <Button disabled className="w-full">
          No Connections Available
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              disabled={isLoading || exceededLimit} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Run Enrichment
                  <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {hasSalesforceConnection && (
              <DropdownMenuItem 
                onClick={executeSFDC}
                disabled={isLoading || exceededLimit}
                className="cursor-pointer"
              >
                Salesforce
              </DropdownMenuItem>
            )}
            {hasHubspotConnection && (
              <DropdownMenuItem 
                onClick={executeHubspot}
                disabled={isLoading || exceededLimit}
                className="cursor-pointer"
              >
                HubSpot
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          Error: {error}
        </div>
      )}
    </div>
  )
}
