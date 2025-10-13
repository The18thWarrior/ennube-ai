
import { useState, useEffect } from 'react';
import { } from 'jsforce/lib/types/common'
import { getDescribeGlobalResult, storeDescribeGlobalResult } from '@/lib/client-cache/salesforce';
import { DescribeGlobalResult } from 'jsforce';
import { DescribeResultType } from '@/lib/types';

/**
 * Hook to fetch Salesforce credentials and return a SalesforceClient instance.
 *
 * Usage note:
 * - Returns: { client, isLoading, error, describeGlobal, bulk, describeSobject }
 * - The `bulk` function supports ingest/query flows. For ingest operations that
 *   modify records (insert/update/delete) and provide an `sobjectType`, the hook
 *   will call the server endpoint `/api/salesforce/batch` to execute transactions
 *   using the server-stored Salesforce credentials. This avoids exposing tokens
 *   client-side and centralizes retry/refresh logic.
 * - When sending records to the batch endpoint, the hook automatically splits
 *   payloads into chunks of 100 records per request (Salesforce-friendly batch
 *   size). Responses from each chunk are aggregated and returned as a single
 *   result object: { success: true, operation, results } where `results` is a
 *   flattened array of per-record results.
 * - Supported operations mapped to the server API: `insert` => `create`,
 *   `update` => `update`, `delete` => `delete`. Unsupported operations (e.g.
 *   `upsert`) will fall back to the client-side `bulkAsync` implementation.
 *
 * Example:
 * const { bulk } = useSfdcBatch();
 * await bulk({ type: 'ingest', sobjectType: 'Account', operation: 'insert', records: [...] });
 */
export function useSfdcBatch() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [describeGlobal, setDescribeGlobal] = useState<any | null>(null);
  const [instanceUrl, setInstanceUrl] = useState<string | null>(null);
  const getApiBase = () => '/api/salesforce';
  // Fetch instance URL once
  useEffect(() => {
    if (!instanceUrl) getInstanceUrl();
  },[])
  
  useEffect(() => {
    let isMounted = true;
    async function fetchCredentialsAndDescribe() {
      setIsLoading(true);
      setError(null);
      try {
        let describeResult = await getDescribeGlobalResult();
        if (describeResult && isMounted) {
          setDescribeGlobal(describeResult);
          return; // Use cached result if available
        }

        const res = await fetch('/api/salesforce/describe');
        if (!res.ok) throw new Error('Failed to fetch Salesforce describe');
        const data = await res.json();

        // Try to get describeGlobal from cache
        if (!describeResult) {
          // If not in cache, fetch from Salesforce and store
          await storeDescribeGlobalResult(data as DescribeGlobalResult);
        }
        if (isMounted) setDescribeGlobal(describeResult);
      } catch (err) {
        console.log(err);
        if (isMounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchCredentialsAndDescribe();
    return () => { isMounted = false; };
  }, []);

  const bulk = async (options: {
    type: 'ingest' | 'query',
    sobjectType?: string,
    operation?: 'insert' | 'update' | 'delete',
    externalIdFieldName?: string,
    records?: Array<{ [key: string]: any }>,
    soql?: string,
    timeout?: number
  }) => {
    //if (!client) throw new Error('Salesforce client is not initialized');
    try {
      const { type, sobjectType, operation, records, ...rest } = options;

      // If this is an ingest operation that modifies records and we have an sobjectType,
      // prefer using the server-side API which will run the transactions using the
      // saved Salesforce credentials. For large payloads, split into batches of 100.
      const isIngestModify = type === 'ingest' && Array.isArray(records) && records.length > 0 && sobjectType;

      if (isIngestModify) {
        // Map client-side operations to the API's expected operations
        const opMap: Record<string, string | undefined> = {
          insert: 'create',
          update: 'update',
          delete: 'delete'
        };

        const apiOperation = operation ? opMap[operation] || 'create' : 'create';

        
        // Helper to chunk an array into sized pieces
        const chunkArray = <T,>(arr: T[], size: number): T[][] => {
          const out: T[][] = [];
          for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
          return out;
        };

        const chunks = chunkArray(records as Array<any>, 100);
        const aggregatedResults: any[] = [];

        for (const chunk of chunks) {
          const url = `/api/salesforce/batch?sobjectType=${encodeURIComponent(sobjectType as string)}&operation=${encodeURIComponent(apiOperation)}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(chunk)
          });

          if (!res.ok) {
            // Try to surface server-side error details
            let details: any = null;
            try { details = await res.json(); } catch (e) { details = await res.text(); }
            throw new Error(`Salesforce batch API error: ${res.status} ${res.statusText} - ${JSON.stringify(details)}`);
          }

          const json = await res.json();
          // The API returns { success: true, operation, results }
          if (json && json.results) {
            // flatten results per-chunk
            if (Array.isArray(json.results)) aggregatedResults.push(...json.results);
            else aggregatedResults.push(json.results);
          } else {
            aggregatedResults.push(json);
          }
        }

        return { success: true, operation: apiOperation, results: aggregatedResults };
      }

      // Fallback: use existing client-side bulk implementation for queries or unsupported cases
      //const result = await bulkAsync(client, type, { ...options } as any);
      //return result;
      return;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  };
  //return { client, isLoading, error, describeGlobal, bulk };
  /**
   * Fetches describe details for a specific sObject from the API
   * @param sobject - The API name of the Salesforce object
   * @returns The describe result for the sObject
   */
  const describeSobject = async (sobject: string) => {
    if (!sobject) throw new Error('sobject is required');
    const url = `${getApiBase()}/describe?sobjectType=${encodeURIComponent(sobject as string)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    });

    if (!res.ok) {
      // Try to surface server-side error details
      let details: any = null;
      try { details = await res.json(); } catch (e) { details = await res.text(); }
      throw new Error(`Salesforce batch API error: ${res.status} ${res.statusText} - ${JSON.stringify(details)}`);
    }

    const json = await res.json() as { describe: DescribeResultType};
    return json;
  }

  const getInstanceUrl = async () => {
    try {
      const instRes = await fetch(`${getApiBase()}/instance`, { credentials: 'same-origin' });
      if (instRes.ok) {
        const inst = await instRes.json();
        setInstanceUrl(inst?.instanceUrl || null);
      }
    } catch (e) {
      // best-effort
    }
  };

  return { isLoading, error, describeGlobal, bulk, describeSobject, getInstanceUrl };
}
