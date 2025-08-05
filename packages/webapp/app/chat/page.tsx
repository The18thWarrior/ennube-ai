import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { setThread } from '@/lib/cache/message-history';
import { auth } from '@/auth';
import React from 'react';
import Image from 'next/image';
import AgentCards from '@/components/chat/default/agent-card';
import { agents } from '@/resources/agent-defintion';

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

