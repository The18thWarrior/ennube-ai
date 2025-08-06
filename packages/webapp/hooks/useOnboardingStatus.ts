'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSnackbar } from 'notistack';

export type OnboardingStage = 
  | 'new' 
  | 'needs_credential' 
  | 'needs_agent_config' 
  | 'has_not_executed' 
  | 'complete';

interface UseOnboardingStatusReturn {
  stage: OnboardingStage;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to track a user's onboarding status through the various stages of setup
 * Checks if they have credentials, agent settings, and executed logs
 * @returns The current onboarding stage and loading state
 */
export function useOnboardingStatus(): UseOnboardingStatusReturn {
  const { data: session, status: sessionStatus } = useSession();
  const [stage, setStage] = useState<OnboardingStage>('new');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const checkOnboardingStatus = async () => {
    if (!session?.user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Check if the user has any credentials
      const credentialResponse = await fetch('/api/salesforce/credentials');
      
      // If user doesn't have credentials, they're at the first stage
      if (!credentialResponse.ok) {
        console.log('Failed to fetch credentials:', credentialResponse);
        setStage('needs_credential');
        return;
      }

      const credentials = await credentialResponse.json();
      if (!credentials || credentials.hasCredentials === false) {
        console.log('Failed to fetch credentials:', credentials);
        setStage('needs_credential');
        return;
      }

      // Step 2: Check if the user has any agent settings configured
      const agentSettingsResponse = await fetch('/api/agents/settings');
      
      if (!agentSettingsResponse.ok) {
        setStage('needs_agent_config');
        return;
      }

      const agentSettings = await agentSettingsResponse.json();
      if (!agentSettings || !Array.isArray(agentSettings) || agentSettings.length === 0 || !agentSettings.some(setting => setting.active)) {
        setStage('needs_agent_config');
        return;
      }

      // Step 3: Check if the user has any successful execution logs
      const usageLogsResponse = await fetch('/api/dashboard/usage?limit=10');
      
      if (!usageLogsResponse.ok) {
        setStage('has_not_executed');
        return;
      }

      const usageLogs = await usageLogsResponse.json();
      if (
        !usageLogs || 
        !Array.isArray(usageLogs) || 
        usageLogs.length === 0 ||
        !usageLogs.some(log => 
          (log.status === 'success' || log.status === 'Success') && 
          (log.recordsCreated > 0 || log.recordsUpdated > 0 || log.meetingsBooked > 0)
        )
      ) {
        setStage('has_not_executed');
        return;
      }

      // If all checks pass, the user has completed onboarding
      setStage('complete');
    } catch (err) {
      console.log('Error checking onboarding status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to check onboarding status';
      setError(errorMessage);
      enqueueSnackbar('Error checking your onboarding status', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Check onboarding status when the session changes
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      checkOnboardingStatus();
    } else if (sessionStatus === 'unauthenticated') {
      setStage('new');
      setIsLoading(false);
    }
  }, [session, sessionStatus]);

  // Function to manually refresh the onboarding status
  const refresh = async () => {
    await checkOnboardingStatus();
  };

  return {
    stage,
    isLoading,
    error,
    refresh
  };
}
