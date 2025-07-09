import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { setThread } from '@/lib/cache/message-history';
import { auth } from '@/auth';
import React from 'react';
import Image from 'next/image';
import AgentCards from '@/components/chat/default/agent-card';

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
    },
    {
      id: 4,
      name: "Market Nurturer",
      apiName: 'market-nurturer',
      role: "Relationship Builder",
      description:
        "Nurtures long-term buying prospects through personalized content, timely communications, and relationship building.",
      image: "/market-nurturer.png",
      link: "/agents/market-nurturer",
      button: null,
      categories: ["marketing", "nurturing", "communication"],
      skills: ["content personalization", "email campaigns", "lead nurturing", "relationship management"],
      isNew: true,
      comingSoon: true,
      hasImage: true,
    }
];


export default async function ChatDefaultPage() {
  const session = await auth();
  if (!session?.user?.auth0?.sub) {
    redirect('/login');
    return;
  }

  // This function must be called from client-side, so we expose it via a client component below
  // and pass the session as prop
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Start a Chat with an AI Agent</h1>
      <p className="text-lg text-center mb-10 text-gray-600">Select an agent below to begin a new conversation tailored to your business needs.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AgentCards agents={agents} />
      </div>
    </div>
  );
}

