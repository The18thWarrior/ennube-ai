'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AgentCard from '@/components/agents/agent-card';
import DataStewardExecuteButton from '@/components/agents/data-steward/data-steward-execute-button';

export default function Dashboard() {
  const router = useRouter();

  // Redirect to the usage logs page by default
  useEffect(() => {
    //router.push('/dashboard/usage-logs');
  }, [router]);

  const agents = [
    {
      id: 1,
      name: "Data Steward",
      role: "Data Management Expert",
      description:
        "Maintains the quality of data in your CRM by leveraging online search tools to verify, enrich, and clean customer information.",
      image: "/data-steward.png",
      link: "/dashboard/data-steward",
      button: <DataStewardExecuteButton />,
      categories: ["data", "management", "quality"],
      skills: ["data cleaning", "verification", "enrichment", "standardization"],
      isNew: false,
      comingSoon: false,
      hasImage: true,
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3 p-4">
      {agents.map((agent) => {
        return (
          <AgentCard agent={agent} key={agent.id} />
        )
      })}
    </div>
  );
}
