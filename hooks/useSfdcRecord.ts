import { useSession } from 'next-auth/react';
import { useState, useCallback } from 'react';

interface SfdcRecord {
  [key: string]: any;
}

interface UseSfdcRecordResult {
  record: SfdcRecord | null;
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
    const { data: session, status } = useSession();
    const [record, setRecord] = useState<SfdcRecord | null>(initialRecord);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [objectDescribe, setObjectDescribe] = useState<any>(null);
    const subId = session?.user?.auth0?.sub || null;
    // Helper to get Salesforce API base URL (customize as needed)
    const getApiBase = () => '/api/salesforce';

    const getRecord = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
        const res = await fetch(`${getApiBase()}/query?sub=${subId}&soql=SELECT+FIELDS(ALL)+FROM+${sobject}+WHERE+Id='${id}'+LIMIT+1`);
        if (!res.ok) throw new Error(`Failed to fetch record: ${res.statusText}`);
        const data = await res.json();
        setRecord(data);
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
        const res = await fetch(`${getApiBase()}/data/${sobject}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to create record: ${res.statusText}`);
        const created = await res.json();
        setRecord(created);
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
        const res = await fetch(`${getApiBase()}/record/${sobject}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to update record: ${res.statusText}`);
        const updated = await res.json();
        setRecord(updated);
        } catch (err: any) {
        setError(err);
        } finally {
        setLoading(false);
        }
    };

    const deleteRecord = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
        const res = await fetch(`${getApiBase()}/record/${sobject}/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error(`Failed to delete record: ${res.statusText}`);
        setRecord(null);
        } catch (err: any) {
        setError(err);
        } finally {
        setLoading(false);
        }
    };

    // Internal method to get object describe (for picklists, etc.)
    const getObjectDescribe = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
        const res = await fetch(`${getApiBase()}/describe/${sobject}`);
        if (!res.ok) throw new Error(`Failed to get object describe: ${res.statusText}`);
        return await res.json();
        } catch (err: any) {
        setError(err);
        throw err;
        } finally {
        setLoading(false);
        }
    }, [sobject]);

    return {
        record,
        loading,
        error,
        getRecord,
        createRecord,
        updateRecord,
        deleteRecord,
        getObjectDescribe,
    };
}
