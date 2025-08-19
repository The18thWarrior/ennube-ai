'use client'

import React, { useEffect, useMemo, useState } from 'react';
import MultiAgentChat from './multi-agent-chat';
import { useMultiAgentChat } from '@/hooks/useMultiAgentChat';
import AgentStatusGrid from './agent-status-grid';
import RoundActivityPanel from './round-activity-panel';
import MultiAgentInput from './multi-agent-input';
import ConversationSummary from './conversation-summary';
import { Card, CardContent } from '@/components/ui/card';

export default function MultiAgentContainer() {
  const { events, isActive, error, startConversation } = useMultiAgentChat();
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['data-steward','prospect-finder']);
  const [rounds, setRounds] = useState<number>(2);
  const [summary, setSummary] = useState<any | null>(null);

  // derive agentActivities and currentRound from events
  const agentActivities = useMemo(() => {
    // simple aggregator: collect latest status per agent
    const activities: any[] = [];
    const byAgent: Record<string, any> = {};
    events.forEach((ev: any) => {
      const t = ev.type;
      const d = ev.data || {};
      if (t === 'agent_start') {
        byAgent[d.agent] = { agent: d.agent, status: 'working', round: d.round, steps: d.maxSteps || 0, currentStep: 1, toolCalls: [] };
      }
      if (t === 'agent_tool_call') {
        byAgent[d.agent] = byAgent[d.agent] || { agent: d.agent, status: 'tool_call', round: d.round, toolCalls: [] };
        byAgent[d.agent].toolCalls = byAgent[d.agent].toolCalls || [];
        byAgent[d.agent].toolCalls.push(d.toolCall || d);
      }
      if (t === 'agent_complete') {
        byAgent[d.agent] = byAgent[d.agent] || { agent: d.agent };
        byAgent[d.agent].status = 'complete';
        byAgent[d.agent].response = d.response;
      }
      if (t === 'agent_response_chunk') {
        byAgent[d.agent] = byAgent[d.agent] || { agent: d.agent, response: '' };
        byAgent[d.agent].response = (byAgent[d.agent].response || '') + d.chunk;
      }
    });
    Object.keys(byAgent).forEach(k => activities.push(byAgent[k]));
    return activities;
  }, [events]);

  useEffect(() => {
    const lastSummary = events.slice().reverse().find((e: any) => e.type === 'conversation_complete');
    if (lastSummary) setSummary(lastSummary.data);
  }, [events]);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <MultiAgentInput
                selectedAgents={selectedAgents}
                setSelectedAgents={setSelectedAgents}
                rounds={rounds}
                setRounds={setRounds}
                onSubmit={(payload: any) => startConversation(payload)}
                disabled={isActive}
              />
            </div>
            <div className="w-96">
              <AgentStatusGrid agents={selectedAgents} activities={agentActivities} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MultiAgentChat defaultAgents={selectedAgents} />
        </div>
        <div>
          <RoundActivityPanel agentActivities={agentActivities} currentRound={1} />
          {summary && <ConversationSummary summary={summary.summary} metadata={summary} onClose={() => setSummary(null)} />}
        </div>
      </div>

      {error && <div className="text-red-600">Error: {String(error)}</div>}
    </div>
  );
}
