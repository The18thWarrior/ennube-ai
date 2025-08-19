"use client"

import { useCallback, useEffect, useRef, useState } from 'react';
import { MultiAgentRequest } from '@/lib/chat/multi-agent/types';

export function useMultiAgentChat() {
  const [events, setEvents] = useState<any[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const startConversation = useCallback(async (request: MultiAgentRequest) => {
    setIsActive(true);
    setError(null);
    setEvents([]);

    // Start SSE request
    try {
      const res = await fetch('/api/chat/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      while (true) {
        const { done, value } = await (reader as any).read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          if (!part.startsWith('data:')) continue;
          const payload = JSON.parse(part.replace(/^data:\s*/, ''));
          setEvents(prev => [...prev, payload]);
        }
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (esRef.current) esRef.current.close();
    }
  }, []);

  return { events, isActive, error, startConversation };
}
