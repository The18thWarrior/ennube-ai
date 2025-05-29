'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AgentCard from '@/components/agents/agent-card';
import DataStewardExecuteButton from '@/components/agents/data-steward/data-steward-execute-button';
import ProspectFinderExecuteButton from '@/components/agents/prospect-finder/prospect-finder-execute-button';

export default function Agents() {
  const router = useRouter();

  // Redirect to the usage logs page by default
  useEffect(() => {
    //router.push('/dashboard/usage-logs');
  }, [router]);

  const agents = [
    {
      id: 1,
      name: "Data Steward",
      apiName: 'data-steward',
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
    },
    {
      id: 2,
      name: "Prospect Finder",
      apiName: 'prospect-finder',
      role: "Lead Generation Specialist",
      description:
        "Creates ideal customer profiles, updates them every 30 days, and finds matching prospects while incorporating feedback from Slack.",
      image: "/prospect-finder.png",
      link: "/dashboard/prospect-finder",
      button: <ProspectFinderExecuteButton />,
      categories: ["sales", "leads", "prospecting"],
      skills: ["lead generation", "customer profiling", "prospect research", "qualification"],
      isNew: true,
      comingSoon: false,
      hasImage: true,
    },
    {
      id: 3,
      name: "Meetings Booker",
      apiName: 'meetings-booker',
      role: "Scheduling Specialist",
      description:
        "Sets up appointments with prospects identified by the Prospect Finder, handling scheduling, reminders, and follow-ups.",
      image: "/meetings-booker.png",
      link: "/dashboard/meetings-booker",
      button: null,
      categories: ["sales", "scheduling", "productivity"],
      skills: ["meeting scheduling", "calendar management", "follow-up", "reminders"],
      isNew: false,
      comingSoon: true,
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
