'use client'

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, CheckCircle } from 'lucide-react';
import { Collapsible } from '@/components/ui/collapsible';

export default function ConversationSummary({ summary, metadata, onClose } : { summary: string; metadata: any; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Conversation Summary</h3>
          </div>
          <div className="text-sm text-green-600">Completed ({metadata?.executionTime || '--'}s)</div>
        </div>

        <div className="prose prose-sm max-w-none mb-3">
          <div>{summary}</div>
        </div>

        <div>
          <Button variant="ghost" onClick={() => setOpen(o => !o)} className="w-full justify-between">
            📊 Details
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {open && (
          <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded border text-sm space-y-2">
            <div>• Total Rounds: {metadata?.totalRounds}</div>
            <div>• Agents Used: {metadata?.totalAgents} ({metadata?.agentNames?.join(', ')})</div>
            <div>• Execution Time: {metadata?.executionTime}s</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
