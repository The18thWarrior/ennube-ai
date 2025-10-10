// Client component for agent cards and selection
"use client";
import { redirect } from 'next/navigation';
import { useTransition } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui';

type Agent = {
  id: number;
  name: string;
  apiName: string;
  role: string;
  description: string;
  image: string;
  link: string;
  button?: any;
  categories: string[];
  skills: string[];
  isNew: boolean;
  comingSoon: boolean;
  hasImage: boolean;
};

export default function AgentCards({ agents }: { agents: Agent[]; }) {
  const [isPending, startTransition] = useTransition();

  async function handleAgentSelected(agent: string) {
    // This will call the server action
    const result = await fetch(`/api/chat?agent=${agent}`);
    const data = await result.json();
    if (!result.ok) {
        console.log('Error starting chat:', data.error);
        return;
    }
    redirect(`/chat/${data.id}?agent=${agent}`);
  }

  return (
    <>
        {agents.map((agent: Agent) => (
            <Card key={agent.id} className="  rounded-lg shadow-md p-6 flex flex-col items-center border   hover:shadow-lg transition-all duration-200 group">
            {agent.hasImage && (
                <Image src={agent.image} alt={agent.name} width={80} height={80} className="rounded-full mb-4" />
            )}
            <h2 className="text-xl font-semibold mb-1">{agent.name}</h2>
            <div className="text-sm text-muted-foreground mb-2">{agent.role}</div>
            <p className="text-muted-foreground  text-center mb-4">{agent.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {agent.skills.map((skill: string) => (
                <span key={skill} className="bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-100 px-2 py-1 rounded text-xs">{skill}</span>
                ))}
            </div>
            <button
                className="mt-auto bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition disabled:opacity-50"
                disabled={isPending || agent.comingSoon}
                onClick={() => {
                if (!agent.comingSoon) startTransition(() => handleAgentSelected(agent.apiName));
                }}
            >
                {agent.comingSoon ? 'Coming Soon' : isPending ? 'Starting...' : `Start Chat`}
            </button>
            </Card>
        ))}
    </>
  );
}