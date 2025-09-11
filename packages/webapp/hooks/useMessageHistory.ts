
import { useCallback } from 'react';

export function useMessageHistory() {


  // Fetch all message histories for a user (POST with body)
  const getAll = useCallback(async () => {
    const res = await fetch('/api/message', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch message histories');
    return res.json();
  }, []);

  // Delete all message histories for a user (POST with body)
  const deleteAll = useCallback(async () => {
    const res = await fetch('/api/message', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to delete all message histories');
    return res.json();
  }, []);

  // Fetch a specific thread (POST with body)
  const getThread = useCallback(async (threadId: string, agent: 'data-steward' | 'prospect-finder' | 'contract-reader' | undefined) => {
    const res = await fetch(`/api/message/${encodeURIComponent(threadId)}${agent ? `?agent=${agent}` : ''}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch thread');
    return await res.json();
  }, []);

  // Create or update a thread
  const setThread = useCallback(async (threadId: string, messages: any[], name: string, currentAgent: string) => {
    const res = await fetch(`/api/message/${encodeURIComponent(threadId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, name, currentAgent }),
    });
    if (!res.ok) throw new Error('Failed to set thread');
    return res.json();
  }, []);

  // Delete a specific thread
  const deleteThread = useCallback(async (threadId: string) => {
    const res = await fetch(`/api/message/${encodeURIComponent(threadId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to delete thread');
    return res.json();
  }, []);

  return {
    getAll,
    deleteAll,
    getThread,
    setThread,
    deleteThread,
  };
}
