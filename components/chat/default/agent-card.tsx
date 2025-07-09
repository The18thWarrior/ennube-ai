// Client component for agent cards and selection
"use client";
import { setThread } from '@/lib/cache/message-history';
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';
import { useTransition } from 'react';
import Image from 'next/image';

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
        console.error('Error starting chat:', data.error);
        return;
    }
    redirect(`/chat/${data.id}?agent=${agent}`);
  }

  return (
    <>
        {agents.map((agent: Agent) => (
            <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group">
            {agent.hasImage && (
                <Image src={agent.image} alt={agent.name} width={80} height={80} className="rounded-full mb-4" />
            )}
            <h2 className="text-xl font-semibold mb-1">{agent.name}</h2>
            <div className="text-sm text-gray-500 mb-2">{agent.role}</div>
            <p className="text-gray-700 dark:text-gray-300 text-center mb-4">{agent.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {agent.skills.map((skill: string) => (
                <span key={skill} className="bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-100 px-2 py-1 rounded text-xs">{skill}</span>
                ))}
            </div>
            <button
                className="mt-auto bg-primary dark:bg-gray-700 text-white px-4 py-2 rounded hover:bg-primary-dark transition disabled:opacity-50"
                disabled={isPending || agent.comingSoon}
                onClick={() => {
                if (!agent.comingSoon) startTransition(() => handleAgentSelected(agent.apiName));
                }}
            >
                {agent.comingSoon ? 'Coming Soon' : isPending ? 'Starting...' : `Start Chat`}
            </button>
            </div>
        ))}
    </>
  );
}