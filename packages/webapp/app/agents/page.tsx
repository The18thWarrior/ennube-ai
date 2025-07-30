'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AgentCard from '@/components/agents/agent-card';
import DataStewardExecuteButton from '@/components/agents/data-steward/data-steward-execute-button';
import ProspectFinderExecuteButton from '@/components/agents/prospect-finder/prospect-finder-execute-button';
import { agents } from '@/resources/agent-defintion'; // Import the agents definition
import { Button } from '@/components/ui';
import { Agent } from 'http';
export default function Agents() {
  const router = useRouter();

  // Redirect to the usage logs page by default
  useEffect(() => {
    //router.push('/dashboard/usage-logs');
  }, [router]);

  const AgentButton = ({apiName}: {apiName: string}) => {
    return (
      <div className="space-y-4">
            <Button 
              onClick={() => router.push(`/agents/${apiName}`)}  
              className="w-full"
            >
              Open
            </Button>            
          </div>
    )
  };
  const _agents = agents.map(agent => {
    let agentButton; 
    console.log('Agent API Name:', agent.apiName); // Log the agent's API name for debugging
    switch (agent.apiName) {
      case 'data-steward':
        // agentButton = <DataStewardExecuteButton />;
        agentButton = <AgentButton apiName={agent.apiName} />;
        break;
      case 'prospect-finder':
        agentButton = <AgentButton apiName={agent.apiName} />;
        break;
      case 'contract-reader':
        agentButton = <AgentButton apiName={agent.apiName} />;
        break;
      default:
        agentButton = null;
    }
    

    return {
      ...agent,
      link: `/agents/${agent.apiName}`, // Update the link to point to the agents page
      button: agentButton, // Ensure button is set or null
    };
  });

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3 p-4 max-w-6xl mx-auto">
      {_agents.map((agent) => {
        return (
          <AgentCard agent={agent} key={agent.id} />
        )
      })}
    </div>
  );
}
