'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// MultiSelect not available in UI primitives; use simple buttons instead
import { avatarOptions } from './agents';

export default function MultiAgentInput({ selectedAgents, setSelectedAgents, rounds, setRounds, onSubmit, disabled }: any) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <div className="w-48">
          {/* Simple multi-select built from avatarOptions */}
          <label className="text-xs">Agents</label>
          <div className="mt-1 flex gap-2 flex-wrap">
            {avatarOptions.map(opt => (
              <button key={opt.key} onClick={() => setSelectedAgents((prev: string[]) => prev.includes(opt.key) ? prev.filter((p: string) => p !== opt.key) : [...prev, opt.key])} className={`px-2 py-1 border rounded ${selectedAgents.includes(opt.key) ? 'bg-accent text-white' : ''}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs">Rounds</label>
          <Select value={String(rounds)} onValueChange={(v) => setRounds(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <div>
          <Button onClick={() => onSubmit({ agents: selectedAgents, rounds, messages: [{ role: 'user', content: 'User started conversation' }] })} disabled={disabled || selectedAgents.length === 0}>Run</Button>
        </div>
      </div>
    </div>
  );
}
