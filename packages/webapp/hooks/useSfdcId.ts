import { RecordIcon } from '@/components/chat/tools/icon-map';
import { getDescribeGlobalResult, storeDescribeGlobalResult } from '@/lib/client-cache/salesforce';
import { createConnection, describeGlobal as describeGlobalAsync } from '@/lib/salesforce-client';
import { getSfdcRecord, storeSfdcRecord, SfdcRecordCachePayload } from '@/lib/client-cache/sfdc-record';
import { Connection, DescribeGlobalResult } from 'jsforce';
import { useSession } from 'next-auth/react';
import { useState, useCallback, useEffect } from 'react';

interface SfdcRecord {
  [key: string]: any;
  Id?: string;
  attributes?: {
    type: string;
    url: string;
  };
}

interface CrmRecordSummary {
  id: string
  fields: {
    icon: React.ElementType
    label: string
    value: React.ReactNode
  }[],
  objectType: string
}

interface UseSfdcRecordResult {
  record: CrmRecordSummary | null;
  loading: boolean;
  error: string | null;
  sobject: string | null;
  updatedAt?: number;
}

/**
 * Hook for Salesforce record CRUD and describe operations.
 * @param initialRecord - The initial Salesforce record object
 * @param sobject - The Salesforce sObject API name (e.g., 'Account')
 */
export function useSfdcId(id: string): UseSfdcRecordResult {
    const { data: session, status } = useSession();
    const [record, setRecord] = useState<CrmRecordSummary | null>(null);
    const [updateStamp, setUpdateStamp] = useState<number | undefined>(undefined);
    const [sobject, setSobject] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [describeGlobal, setDescribeGlobal] = useState<DescribeGlobalResult | null>(null);
    const subId = session?.user?.auth0?.sub || null;
    // Helper to get Salesforce API base URL (customize as needed)
    const getApiBase = () => '/api/salesforce';

    useEffect(() => {
        let isMounted = true;
        async function fetchCredentialsAndDescribe() {
            setLoading(true);
            setError(null);
            try {
                let describeResult = await getDescribeGlobalResult();
                if (describeResult && isMounted) {
                    setDescribeGlobal(describeResult as DescribeGlobalResult);
                    return; // Use cached result if available
                }

                const res = await fetch('/api/salesforce/credentials');
                if (!res.ok) throw new Error('Failed to fetch Salesforce credentials');
                const data = await res.json();
                if (!data.accessToken || !data.instanceUrl) throw new Error('Missing Salesforce credentials');
                const sfdcClient = await createConnection(
                    data.accessToken,
                    data.instanceUrl,
                    data.refreshToken // Pass refreshToken if available
                );

                // Try to get describeGlobal from cache
                if (!describeResult) {
                    // If not in cache, fetch from Salesforce and store
                    describeResult = await describeGlobalAsync(sfdcClient);
                    await storeDescribeGlobalResult(describeResult as import('jsforce/lib/types/common').DescribeGlobalResult);
                }
                if (isMounted) setDescribeGlobal(describeResult as DescribeGlobalResult);
            } catch (err) {
                console.log(err);
                if (isMounted) setError(err instanceof Error ? err.message : String(err));
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        fetchCredentialsAndDescribe();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (!id || !describeGlobal) return;

        const sobjectName = describeGlobal.sobjects.find((s) => s.keyPrefix && id.startsWith(s.keyPrefix))?.name;
        if (!sobjectName) {
            setError('Invalid Salesforce ID or object type not found');
            return;
        }
        setSobject(sobjectName);
    }, [id, describeGlobal])

    useEffect(() => {
        if (!sobject || !id) return;
        getRecord();
    }, [sobject, id]);

    const getRecord = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!sobject) {
                throw new Error('sObject type is not set');
            }
            // Try to load from IndexedDB first

            const cached: SfdcRecordCachePayload | null = await getSfdcRecord(id);
            if (cached && cached.record && cached.sobject === sobject) {
                setUpdateStamp(cached.updatedAt);
                //console.log("Loaded record from cache:", cached.record);
                // Convert cached raw record to CrmRecordSummary for state
                const fields = Object.entries(cached.record).map(([key, value]) => ({
                    label: key,
                    value: value as React.ReactNode,
                    icon: RecordIcon.getIcon('default') || (() => null),
                }));
                setRecord({
                    id: cached.record.Id,
                    fields,
                    objectType: sobject
                });
                setLoading(false);
                return;
            }

            // Not in cache, fetch from Salesforce
            const res = await fetch(`${getApiBase()}/query?sub=${subId}&soql=SELECT+FIELDS(ALL)+FROM+${sobject}+WHERE+Id='${id}'+LIMIT+1`);
            if (!res.ok) throw new Error(`Failed to fetch record: ${res.statusText}`);
            const data = await res.json();
            if (!data || !data.records || data.records.length === 0) {
                throw new Error('Record not found');
            }
            const recordData = data.records[0];
            const fields = Object.entries(recordData).map(([key, value]) => ({
                label: key,
                value: value as React.ReactNode,
                icon: RecordIcon.getIcon('default') || (() => null),
            }));
            setRecord({
                id: recordData.Id,
                fields,
                objectType: sobject
            });
            // Store the raw record in IndexedDB
            const stamp = Date.now();
            setUpdateStamp(stamp);
            await storeSfdcRecord(id, {
                updatedAt: stamp,
                record: recordData,
                sobject
            });
        } catch (err: any) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };


    return {
        record,
        loading,
        error,
        sobject,
        updatedAt: updateStamp
    };
}
function describeAsync(arg0: Connection, sobject: string) {
    throw new Error('Function not implemented.');
}

