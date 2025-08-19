'use client'

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CircleCheck, Loader2, TriangleAlert } from 'lucide-react';
import ToolCallDisplay from './tool-call-display';

export default function AgentActivityCard({ activity } : { activity: any }) {
  if (!activity) return null;
  const { agent, status, steps = 0, currentStep = 0, toolCalls = [], response } = activity;
  return (
    <Card className="p-2">
      <CardContent>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-medium">{agent}</div>
            <div className="text-xs text-muted-foreground">Step {currentStep} of {steps || '--'}</div>
          </div>
          <div className="text-sm">
            {status === 'working' && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === 'complete' && <CircleCheck className="h-4 w-4 text-green-600" />}
            {status === 'error' && <TriangleAlert className="h-4 w-4 text-red-600" />}
          </div>
        </div>

        {toolCalls && toolCalls.length > 0 && (
          <div className="space-y-2">
            {toolCalls.map((tc: any) => (
              <ToolCallDisplay key={tc.id || tc.name} toolCall={tc} isActive={false} />
            ))}
          </div>
        )}

        {response && <div className="mt-2 text-sm">{response}</div>}
      </CardContent>
    </Card>
  );
}
