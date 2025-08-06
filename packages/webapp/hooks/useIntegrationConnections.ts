import { useState, useEffect } from 'react';
import { ProviderType } from '@/lib/db/agent-settings-storage';

/**
 * Hook to fetch and manage integration connection status
 * Returns a boolean value for each integration type defined in ProviderType
 */
export function useIntegrationConnections() {
  const [connections, setConnections] = useState<Record<ProviderType, boolean>>({
    sfdc: false,
    gmail: false,
    hubspot: false,
    msoffice: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/helpers/status');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch integration status: ${response.statusText}`);
        }
        
        const data = await response.json();
        setConnections(data);
        setError(null);
      } catch (err) {
        console.log('Error fetching integration connections:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnectionStatus();
  }, []);

  return {
    connections,
    isLoading,
    error,
    // Individual connection statuses for convenience
    isSalesforceConnected: connections.sfdc,
    isGmailConnected: connections.gmail,
    isHubSpotConnected: connections.hubspot,
    isMsOfficeConnected: connections.msoffice,
  };
}

export default useIntegrationConnections;