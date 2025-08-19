'use client'

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const statusConfig: any = {
  idle: { color: 'gray', icon: null, label: 'Idle' },
  working: { color: 'blue', icon: Loader2, label: 'Working' },
  tool_call: { color: 'orange', icon: Loader2, label: 'Tool' },
  complete: { color: 'green', icon: CheckCircle, label: 'Complete' },
  error: { color: 'red', icon: AlertTriangle, label: 'Error' },
};

export default function AgentStatusGrid({ agents = [], activities = [] } : { agents: string[]; activities: any[] }) {
  const byAgent: Record<string, any> = {};
  activities.forEach(a => byAgent[a.agent] = a);

  return (
    <div className="space-y-2">
      {agents.map(agentKey => {
        const activity = byAgent[agentKey];
        const status = activity?.status || 'idle';
        const cfg = statusConfig[status] || statusConfig.idle;
        return (
          <Card key={agentKey} className="p-2">
            <CardContent className="flex items-center gap-3">
              <div className="w-12">
                <Avatar>
                  <AvatarImage src={`/${agentKey}.png`} alt={agentKey} />
                  <AvatarFallback>{agentKey.split('-').map(s => s[0]).join('').toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="font-medium">{agentKey}</div>
                <div className="text-xs text-muted-foreground truncate">{activity?.response || activity?.toolCalls?.[0]?.name || cfg.label}</div>
              </div>
              <div className="w-20 text-right text-xs">
                {activity?.status === 'working' && <Loader2 className="h-4 w-4 animate-spin inline-block mr-1" />}
                {activity?.status === 'complete' && <CheckCircle className="h-4 w-4 text-green-600 inline-block mr-1" />}
                {activity?.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-600 inline-block mr-1" />}
                <div className="text-xxs text-muted-foreground">{cfg.label}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
