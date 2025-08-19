'use client'

import React, { useState } from 'react';
import ChatContainer from './chat-container';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import { avatarOptions } from './agents';
import { Button } from '@/components/ui/button';

export default function MultiAgentChat({ defaultAgents = [avatarOptions[0].key] as string[] } : { defaultAgents?: string[] }) {
  const { events, isActive, error, startConversation } = useMultiAgentChat();
  const [agents, setAgents] = useState<string[]>(defaultAgents);
  const [rounds, setRounds] = useState<number>(2);
  const [input, setInput] = useState('');

  const handleStart = async () => {
    if (!input.trim()) return;
    await startConversation({ agents, rounds, messages: [{ role: 'user', content: input }] });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="flex gap-2">
          {agents.map(a => avatarOptions.find(o => o.key === a)?.avatar)}
        </div>
        <div className="flex-1">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe task for agents..." className="w-full p-2 border rounded" />
        </div>
        <Button onClick={handleStart} disabled={isActive || !input.trim()}>Start</Button>
      </div>

      <ChatContainer initialMessages={[]} />

      <div className="space-y-2">
        <div>Events:</div>
        <pre className="max-h-64 overflow-auto bg-slate-50 p-2 rounded">{JSON.stringify(events, null, 2)}</pre>
        {error && <div className="text-red-500">Error: {error}</div>}
      </div>
    </div>
  );
}
