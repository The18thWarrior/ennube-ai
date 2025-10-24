'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useSnackbar } from 'notistack';
import { useUser } from '@auth0/nextjs-auth0';

export type OnboardingStage = 
  | 'new' 
  | 'needs_credential' 
  | 'needs_agent_config' 
  | 'has_not_executed' 
  | 'complete';

interface UseOnboardingStatusReturn {
  stage: OnboardingStage;
  instanceUrl: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Create the context
const OnboardingStatusContext = createContext<UseOnboardingStatusReturn | undefined>(undefined);

/**
 * Hook to access the onboarding status context
 * Must be used within OnboardingStatusProvider
 * @returns The current onboarding stage and loading state
 */
export function useOnboardingStatus(): UseOnboardingStatusReturn {
  const context = useContext(OnboardingStatusContext);
  if (!context) {
    throw new Error('useOnboardingStatus must be used within OnboardingStatusProvider');
  }
  return context;
}

/**
 * Provider component for onboarding status context
 * Wraps the application to provide onboarding state to all child components
 */
export function OnboardingStatusProvider({ children }: { children: ReactNode }) {
  return (
    <OnboardingStatusContext.Provider value={useOnboardingStatusLogic()}>
      {children}
    </OnboardingStatusContext.Provider>
  );
}

/**
 * Internal hook containing the onboarding status logic
 * Tracks a user's onboarding status through the various stages of setup
 * Checks if they have credentials, agent settings, and executed logs
 * @returns The current onboarding stage and loading state
 */
function useOnboardingStatusLogic(): UseOnboardingStatusReturn {
  const { user } = useUser();
  const [stage, setStage] = useState<OnboardingStage>('new');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instanceUrl, setInstanceUrl] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const checkOnboardingStatus = async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call consolidated onboarding endpoint which returns
      // { hasCredentials, hasAgentSettings, hasSuccessfulExecution }
      const resp = await fetch('/api/salesforce/check-onboarding');

      if (!resp.ok) {
        console.log('Failed to fetch onboarding summary:', resp);
        // If the endpoint fails, conservatively mark as needs credential
        setStage('needs_credential');
        return;
      }

      const data = await resp.json();

      const hasCredentials = Boolean(data?.hasCredentials);
      const hasAgentSettings = Boolean(data?.hasAgentSettings);
      const hasSuccessfulExecution = Boolean(data?.hasSuccessfulExecution);
      setInstanceUrl(data?.instanceUrl || null);

      if (!hasCredentials) {
        setStage('needs_credential');
        return;
      }

      if (!hasAgentSettings) {
        setStage('needs_agent_config');
        return;
      }

      if (!hasSuccessfulExecution) {
        setStage('has_not_executed');
        return;
      }

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
    if (user) {
      checkOnboardingStatus();
    } else {
      setStage('new');
      setIsLoading(false);
    }
  }, [user]);

  // Function to manually refresh the onboarding status
  const refresh = async () => {
    await checkOnboardingStatus();
  };

  return {
    stage,
    instanceUrl,
    isLoading,
    error,
    refresh
  };
}
