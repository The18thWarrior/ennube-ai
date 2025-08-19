import React from 'react';
import MultiAgentContainer from '@/components/chat/multi-agent-container';

export const metadata = {
  title: 'Multi-Agent Chat',
};

export default function Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Multi-Agent Conversation</h1>
      <MultiAgentContainer />
    </div>
  );
}
