'use client'

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AgentActivityCard from './agent-activity-card';

export default function RoundActivityPanel({ agentActivities = [], currentRound = 1 } : { agentActivities: any[]; currentRound?: number }) {
  const currentRoundActivities = agentActivities.filter(a => a.round === currentRound || a.round == null);

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Round {currentRound} Activity</h3>
          <div className="text-sm text-muted-foreground">⏱️ -- elapsed</div>
        </div>
        <div className="space-y-3">
          {currentRoundActivities.length === 0 && <div className="text-sm text-muted-foreground">No activity yet.</div>}
          {currentRoundActivities.map(act => (
            <AgentActivityCard key={act.agent} activity={act} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
