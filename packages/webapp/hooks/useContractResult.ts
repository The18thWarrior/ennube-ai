// === useContractResult.ts ===
// Created: 2025-07-29
// Purpose: React hook for CRUD operations on contract results via API
// Exports:
//   - useContractResult
// Interactions:
//   - Uses: /api/contract-result endpoint
// Notes:
//   - Type-safe, handles loading/error states, usage example included

import { useState } from 'react';

export interface ContractResult {
  id?: string;
  user_id: string;
  created_at?: string;
  updated_at?: number;
  source_id: string;
  provider: 'sfdc' | 'hubspot' | 'gmail' | 'msoffice';
  contract_data: Record<string, unknown>;
}

/**
 * OVERVIEW
 *
 * - Purpose: Provides CRUD operations for contract results via API.
 * - Assumptions: API returns structured JSON, errors handled gracefully.
 * - Edge Cases: Network errors, missing fields, API failures.
 * - How it fits: Enables frontend components to manage contract results.
 * - Future Improvements: Add SWR/React Query, pagination, optimistic updates.
 */

export function useContractResult() {
  const [results, setResults] = useState<ContractResult[]>([]);
  const [result, setResult] = useState<ContractResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all contract results for the current user
  const getResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contract-result`);
      const data = await res.json();
      if (res.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to fetch contract results');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Get a single contract result by id
  const getResult = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contract-result?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Contract result not found');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Get a single contract result by source_id
  const getResultBySourceId = async (source_id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contract-result?source_id=${encodeURIComponent(source_id)}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Contract result not found');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Create a new contract result
  const createResult = async (input: Omit<ContractResult, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contract-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      const data = await res.json();
      if (res.ok) {
        await getResults();
        return data.id || data;
      } else {
        setError(data.error || 'Failed to create contract result');
        return null;
      }
    } catch (err) {
      setError('Network error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing contract result
  const updateResult = async (id: string, updates: Partial<Omit<ContractResult, 'id' | 'user_id' | 'created_at'>>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contract-result', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      const data = await res.json();
      if (res.ok) {
        await getResults();
        return true;
      } else {
        setError(data.error || 'Failed to update contract result');
        return false;
      }
    } catch (err) {
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a contract result
  const deleteResult = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contract-result?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        await getResults();
        return true;
      } else {
        setError(data.error || 'Failed to delete contract result');
        return false;
      }
    } catch (err) {
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    result,
    loading,
    error,
    getResults,
    getResult,
    getResultBySourceId,
    createResult,
    updateResult,
    deleteResult
  };
}

/**
 * Usage Example:
 *
 * const {
 *   results, result, loading, error,
 *   getResults, getResult, getResultBySourceId, createResult, updateResult, deleteResult
 * } = useContractResult();
 *
 * useEffect(() => { getResults(); }, []);
 */

/*
 * === useContractResult.ts ===
 * Updated: 2025-07-29
 * Summary: React hook for contract result CRUD via API
 * Key Components:
 *   - useContractResult: Main hook
 * Dependencies:
 *   - Requires: React
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Handles loading/error states, usage example included
 */
