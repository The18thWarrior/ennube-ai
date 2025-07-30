'use client';

import React from 'react';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { Button } from '@/components/ui/button';

/**
 * Example component showing how to use the onboarding status hook
 */
export function OnboardingStatusIndicator() {
  const { stage, isLoading, error, refresh } = useOnboardingStatus();

  if (isLoading) {
    return <div>Loading onboarding status...</div>;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded-md bg-red-50">
        <p className="text-red-700">Error: {error}</p>
        <Button 
          variant="outline" 
          onClick={refresh} 
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const stageMessages = {
    new: 'Welcome! Let\'s get you set up.',
    needs_credential: 'First, let\'s connect your account to Salesforce.',
    needs_agent_config: 'Great! Now let\'s configure your agent settings.',
    has_not_executed: 'Almost there! Try running an agent to complete setup.',
    complete: 'Your setup is complete! You\'re ready to use all features.'
  };

  const stageProgress = {
    new: 0,
    needs_credential: 20,
    needs_agent_config: 40,
    has_not_executed: 80,
    complete: 100
  };

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-semibold text-lg">Onboarding Progress</h3>
      
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${stageProgress[stage]}%` }}
        />
      </div>
      
      <p className="mt-2">{stageMessages[stage]}</p>
      
      <Button 
        variant="outline" 
        onClick={refresh} 
        className="mt-2 text-sm"
        size="sm"
      >
        Refresh Status
      </Button>
    </div>
  );
}
