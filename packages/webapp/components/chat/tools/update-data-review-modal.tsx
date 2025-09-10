"use client";
import React, { useState } from 'react';
import type { ProposalResponse, UpdateProposal } from '@/types/sfdc-update';
import { useSfdcRecord } from '@/hooks/useSfdcRecord';
import { useSfdcBatch } from '@/hooks/useSfdcBatch';
import { UIMessage, UIDataTypes, UITools, isToolUIPart } from 'ai';
import { CircleCheck, TriangleAlert } from 'lucide-react';

type Props = {
  open: boolean;
  partId?: string;
  proposal?: UpdateProposal | null;
  status?: 'draft' | 'proposed' | 'approved' | 'executing' | 'completed' | 'rejected';
  message?: UIMessage<unknown, UIDataTypes, UITools>;
  closeProposal?: (updatedMessage: UIMessage<unknown, UIDataTypes, UITools>) => void;
};

export function UpdateDataReviewModal({ open, proposal, closeProposal, message, status, partId }: Props) {
  if (!open || !proposal) return null;
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { updateRecord, createRecord, deleteRecord } = useSfdcRecord({}, proposal.changes[0]?.sobject || '');
  const { bulk } = useSfdcBatch();

  const handleApprove = async () => {
    setExecuting(true);
    setError(null);
    setResult(null);
    try {
      // If single change, use useSfdcRecord for convenience
      if (proposal.changes.length === 1) {
        const c = proposal.changes[0];
        if (c.operation === 'update') {
          const data: any = {};
          (c.fields || []).forEach((f) => (data[f.fieldName] = f.after));
          await updateRecord(c.recordId as string, data);
          setResult({ success: true, detail: 'updated single record' });
        } else if (c.operation === 'delete') {
          await deleteRecord(c.recordId as string);
          setResult({ success: true, detail: 'deleted single record' });
        } else if (c.operation === 'create') {
          const data: any = {};
          (c.fields || []).forEach((f) => (data[f.fieldName] = f.after));
          await createRecord(data);
          setResult({ success: true, detail: 'created single record' });
        }
      } else {
        // Batch mode: group by sobject and operation
        const groups: Record<string, Record<string, Array<any>>> = {};
        for (const c of proposal.changes) {
          const key = `${c.sobject}::${c.operation}`;
          groups[key] = groups[key] || { sobject: c.sobject, operation: c.operation, records: [] } as any;
          const recordPayload: any = {};
          (c.fields || []).forEach((f) => (recordPayload[f.fieldName] = f.after));
          if (c.recordId) recordPayload.Id = c.recordId;
          groups[key].records.push(recordPayload);
        }

        const executionResults: any[] = [];
        for (const gKey of Object.keys(groups)) {
          const group = (groups as any)[gKey];
          const op = group.operation === 'update' ? 'update' : group.operation === 'delete' ? 'delete' : group.operation === 'create' ? 'insert' : 'update';
          const bulkResult = await bulk({ type: 'ingest', sobjectType: group.sobject, operation: op as any, records: group.records });
          executionResults.push({ sobject: group.sobject, operation: group.operation, result: bulkResult });
        }
        setResult({ success: true, detail: executionResults });
      }

      // Call external onApprove if provided
      if (closeProposal) {
        const updatedParts = message?.parts?.map((p) => {
          if (!isToolUIPart(p) || p.toolCallId !== partId) return p;
          return {...p, output: { ...p.output as ProposalResponse, status: 'completed' }};
        });

        await closeProposal({...message, parts: updatedParts} as UIMessage<unknown, UIDataTypes, UITools>);
      }
    } catch (err: any) {
      console.error('Execution error:', err);
      setError(err?.message || String(err));
    } finally {
      setExecuting(false);
    }
  };

  const handleCancel = async () => {
    if (closeProposal) {
      const updatedParts = message?.parts?.map((p) => {
        if (!isToolUIPart(p) || p.toolCallId !== partId) return p;
        return {...p, output: { ...p.output as ProposalResponse, status: 'rejected' }};
      });

      await closeProposal({...message, parts: updatedParts} as UIMessage<unknown, UIDataTypes, UITools>);
    }
  }

  if (status === 'completed' || status === 'rejected') { return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground border rounded transition-all duration-3000 ease-in-out transition-discrete ${
           "block py-4 px-2 my-2"
        }`}
      >
        {status === 'completed' ? <CircleCheck className="h-4 w-4 text-green-500" /> : <TriangleAlert className="h-4 w-4 text-red-500" />}
        <span>Proposal {status === 'completed' ? 'Executed' : 'Rejected'}</span>
        
      </div>);
  }

  return (
    <div className="flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-11/12 max-w-2xl p-4">
          <h3 className="text-lg font-semibold">Review proposed changes</h3>
          <p className="text-sm text-muted-foreground">{proposal.summary}</p>

          <div className="mt-4 max-h-64 overflow-auto">
            {proposal.changes.map((c) => (
              <div key={c.operationId} className="border p-2 rounded mb-2">
                <div className="font-medium">{c.sobject} — {c.operation}</div>
                <div className="text-sm">Record: {c.recordId || 'N/A'}</div>
                <ul className="mt-2">
                  {(c.fields || []).map((f) => (
                    <li key={f.fieldName} className="text-sm">
                      <strong>{f.fieldName}</strong>: {String(f.before)} → {String(f.after)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {error && <div className="mt-4 text-red-600">Error: {error}</div>}
          {result && <div className="mt-4 text-green-600">Result: {JSON.stringify(result)}</div>}

          <div className="mt-4 flex justify-end gap-2">
            <button className="px-3 py-1 rounded border" onClick={handleCancel} disabled={executing}>Cancel</button>
            <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={handleApprove} disabled={executing}>{executing ? 'Executing...' : 'Approve & Execute'}</button>
          </div>
        </div>
    </div>
  );
}
