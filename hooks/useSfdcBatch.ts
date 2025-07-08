
import { useState, useEffect } from 'react';
import { createConnection, describeGlobal, bulk as bulkAsync, describe as describeAsync } from '@/lib/salesforce-client';
import { Connection } from 'jsforce';
import { getDescribeGlobalResult, storeDescribeGlobalResult } from '@/lib/client-cache/salesforce';

/**
 * Hook to fetch Salesforce credentials and return a SalesforceClient instance
 * Returns { client, isLoading, error }
 */
export function useSfdcBatch() {
  const [client, setClient] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [describeGlobal, setDescribeGlobal] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchCredentialsAndDescribe() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/salesforce/credentials');
        if (!res.ok) throw new Error('Failed to fetch Salesforce credentials');
        const data = await res.json();
        if (!data.accessToken || !data.instanceUrl) throw new Error('Missing Salesforce credentials');
        const sfdcClient = await createConnection(
          data.accessToken,
          data.instanceUrl,
          data.refreshToken // Pass refreshToken if available
        );
        if (isMounted) setClient(sfdcClient);

        // Try to get describeGlobal from cache
        let describeResult = await getDescribeGlobalResult();
        if (!describeResult) {
          // If not in cache, fetch from Salesforce and store
          describeResult = await describeGlobal(sfdcClient);
          await storeDescribeGlobalResult(describeResult as import('jsforce/lib/types/common').DescribeGlobalResult);
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
    operation?: 'insert' | 'update' | 'upsert' | 'delete',
    externalIdFieldName?: string,
    records?: Array<{ [key: string]: any }>,
    soql?: string,
    timeout?: number
  }) => {
    if (!client) throw new Error('Salesforce client is not initialized');
    try {
      const {type, ...rest} = options;
      const result = await bulkAsync(client, type, rest);
      return result;
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
    const res = await describeAsync(client as Connection, sobject);
    return res;
  };
  
  return { client, isLoading, error, describeGlobal, bulk, describeSobject };
}
