'use client';
import { useCallback, useEffect, useState } from 'react';

export interface ApiKey {
  id: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/api-key');
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
      const data = await res.json();
      setApiKeys(data || []);
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const createApiKey = useCallback(async (): Promise<{ id: string; token?: string } | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/api-key', { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to create (${res.status})`);
      const created = await res.json();
      await fetchApiKeys();
      // Server returns { id, token }
      return created as { id: string; token?: string };
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchApiKeys]);

  const updateApiKey = useCallback(async (id: string, updates: Partial<ApiKey>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/api-key', { method: 'PUT', body: JSON.stringify({ id, ...updates }), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`Failed to update (${res.status})`);
      const updated = await res.json();
      await fetchApiKeys();
      return updated as ApiKey;
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchApiKeys]);

  const deleteApiKey = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/api-key', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
      await fetchApiKeys();
      return true;
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchApiKeys]);

  const generateKey = useCallback(async (id: string) => {
    // Deprecated client-side generation. Use server endpoints instead.
    return null;
  }, [fetchApiKeys]);

  const rotateApiKey = useCallback(async (id: string): Promise<{ id: string; token?: string } | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/api-key/rotate', { method: 'POST', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`Failed to rotate (${res.status})`);
      const body = await res.json();
      await fetchApiKeys();
      return body as { id: string; token?: string };
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchApiKeys]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  return {
    apiKeys,
    loading,
    error,
    fetchApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
  generateKey,
  rotateApiKey
  };
}
