import { useUser } from '@auth0/nextjs-auth0';
import { useState, useCallback, useEffect } from 'react';

interface SfdcRecord {
  [key: string]: any;
}

interface UseSfdcRecordResult {
  record: SfdcRecord | null;
  instanceUrl: string | null;
  loading: boolean;
  error: Error | null;
  getRecord: (id: string) => Promise<void>;
  createRecord: (data: SfdcRecord) => Promise<void>;
  updateRecord: (id: string, data: SfdcRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getObjectDescribe: () => Promise<any>;
}

/**
 * Hook for Salesforce record CRUD and describe operations.
 * @param initialRecord - The initial Salesforce record object
 * @param sobject - The Salesforce sObject API name (e.g., 'Account')
 */
export function useSfdcRecord(initialRecord: SfdcRecord, sobject: string): UseSfdcRecordResult {
    const { user } = useUser();
    const [record, setRecord] = useState<SfdcRecord | null>(initialRecord);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const subId = user?.sub || null;
    // Helper to get Salesforce API base URL (customize as needed)
    const getApiBase = () => '/api/salesforce';
    const [instanceUrl, setInstanceUrl] = useState<string | null>(null);

    // Fetch instance URL once
    useEffect(() => {
      if (!instanceUrl) getInstanceUrl();
    },[])

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

    const getRecord = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
          const headers: Record<string,string> = { 'Content-Type': 'application/json' };
          //if (instanceUrl) headers['x-salesforce-instance'] = instanceUrl;
          const res = await fetch(`${getApiBase()}/query?sub=${subId}&soql=SELECT+FIELDS(ALL)+FROM+${sobject}+WHERE+Id='${id}'+LIMIT+1`, { headers, credentials: 'same-origin' });
          if (!res.ok) throw new Error(`Failed to fetch record: ${res.statusText}`);
          const data = await res.json();
          setRecord(data);
          setError(null);
        } catch (err: any) {
          setError(err);
        } finally {
          setLoading(false);
        }
    };

    const createRecord = async (data: SfdcRecord) => {
        setLoading(true);
        setError(null);
        try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      //if (instanceUrl) headers['x-salesforce-instance'] = instanceUrl;
      const res = await fetch(`${getApiBase()}/data?sub=${subId}&sobjectType=${sobject}`, {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });
          if (!res.ok) {
            setError(new Error(`Failed to create record: ${res.statusText}`));
            //throw new Error(`Failed to create record: ${res.statusText}`);
          } else {
            const created = await res.json();
            setRecord(created);
            setError(null);
          }
        } catch (err: any) {
          setError(err);
        } finally {
          setLoading(false);
        }
    };

    const updateRecord = async (id: string, data: SfdcRecord) => {
        setLoading(true);
        setError(null);
        try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (instanceUrl) headers['x-salesforce-instance'] = instanceUrl;
      const res = await fetch(`${getApiBase()}/data?sub=${subId}&sobjectType=${sobject}`, {
        method: 'PUT',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });
          if (!res.ok) {
            console.log('Update failed:', res);
            setError(new Error(`Failed to update record: ${res.statusText}`));
            //throw new Error(`Failed to update record: ${res.statusText}`);
          } else {
            const updated = await res.json();
            setRecord(updated);
            setError(null);
          }
        } catch (err: any) {
          console.error('Update error:', err);
          setError(err);
        } finally {
          setLoading(false);
        }
    };

    const deleteRecord = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
      const headers: Record<string,string> = {};
      if (instanceUrl) headers['x-salesforce-instance'] = instanceUrl;
      const res = await fetch(`${getApiBase()}/data?sub=${subId}&sobjectType=${sobject}&id=${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'same-origin'
      });
          if (!res.ok) {
            setError(new Error(`Failed to delete record: ${res.statusText}`));
            //throw new Error(`Failed to delete record: ${res.statusText}`);
          } else {
            setRecord(null);
            setError(null);
          }
        } catch (err: any) {
          setError(err);
          setLoading(false);
          //throw err;
        } finally {
          setLoading(false);
        }
    };

    // Internal method to get object describe (for picklists, etc.)
    const getObjectDescribe = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
          const headers: Record<string,string> = { 'Content-Type': 'application/json' };
          if (instanceUrl) headers['x-salesforce-instance'] = instanceUrl;
          const res = await fetch(`${getApiBase()}/describe/${sobject}`, { headers, credentials: 'same-origin' });
          if (!res.ok) {
            setError(new Error(`Failed to get object describe: ${res.statusText}`));
            // throw new Error(`Failed to get object describe: ${res.statusText}`);
          }
          return await res.json();
        } catch (err: any) {
          setError(err);
          //throw err;
        } finally {
          setLoading(false);
        }
    }, [sobject]);

    return {
        record,
        instanceUrl,
        loading,
        error,
        getRecord,
        createRecord,
        updateRecord,
        deleteRecord,
        getObjectDescribe,
    };
}
