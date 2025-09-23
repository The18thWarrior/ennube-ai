"use client";
import React, { useState } from 'react';
import type { ProposalResponse, UpdateProposal } from '@/types/sfdc-update';
import { useSfdcRecord } from '@/hooks/useSfdcRecord';
import { useSfdcBatch } from '@/hooks/useSfdcBatch';
import { UIMessage, UIDataTypes, UITools, isToolUIPart } from 'ai';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Props = {
  open: boolean;
  partId?: string;
  proposal?: UpdateProposal | null;
  status?: 'draft' | 'proposed' | 'approved' | 'executing' | 'completed' | 'rejected';
  message?: UIMessage<unknown, UIDataTypes, UITools>;
  closeProposal?: (updatedMessage: UIMessage<unknown, UIDataTypes, UITools>) => void;
};

type SingleChangeResult = {
  bulkOperation: false;
  change: 'create' | 'update' | 'delete';
  recordId: string | undefined;
}

type BulkChangeResult = {
  bulkOperation: true;
  changedRecords: Array<{
    sobject: string;
    change: string;
    result: any;
  }>;
}

export function UpdateDataReviewModal({ open, proposal, closeProposal, message, status, partId }: Props) {
  if (!open || !proposal) return null;
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<SingleChangeResult | BulkChangeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientCompletion, setClientCompletion] = useState<string | null>(null);

  const { updateRecord, createRecord, deleteRecord, error: sfdcError, loading, instanceUrl } = useSfdcRecord({}, proposal.changes[0]?.sobject || '');
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
          const data: any = {Id: c.recordId};
          (c.fields || []).forEach((f) => (data[f.fieldName] = f.after))
          await updateRecord(c.recordId as string, data);
          if (sfdcError) {
            //console.error('Update error:', sfdcError);
            setError(sfdcError.message);
            setExecuting(false);
            return;
          }
          setResult({ bulkOperation: false, change: 'update', recordId: c.recordId });
        } else if (c.operation === 'delete') {
          await deleteRecord(c.recordId as string);
          if (sfdcError) {
            setError(sfdcError.message);
            setExecuting(false);
            return;
          }

          setResult({ bulkOperation: false, change: 'delete', recordId: c.recordId });
        } else if (c.operation === 'create') {
          const data: any = {};
          (c.fields || []).forEach((f) => (data[f.fieldName] = f.after));
          await createRecord(data);
          if (sfdcError) {
            setError(sfdcError.message);
            setExecuting(false);
            return;
          }
          setResult({ bulkOperation: false, change: 'create', recordId: undefined });
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
        setResult({bulkOperation: true, changedRecords: executionResults });
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
      //console.error('Execution error:', err);
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
    setExecuting(false);
    setClientCompletion('rejected');
  }

  if (clientCompletion === 'rejected') { return (
      
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground border rounded transition-all duration-3000 ease-in-out transition-discrete ${
           "block py-4 px-2 my-2"
        }`}
      >
        <TriangleAlert className="h-4 w-4 text-red-500" />
        <span>Proposal Rejected</span>
        
      </div>);
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
        <div className="  rounded-lg shadow-lg w-11/12 p-4">
          <h3 className="text-lg font-semibold">Review proposed changes</h3>
          <p className="text-sm text-muted-foreground">{proposal.summary}</p>

          <div className="mt-4 max-h-64 overflow-auto scrollbar">
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
          {/* {result && (
            <div className="mt-4">
              <h4 className="text-md font-semibold mb-2">Execution Results</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    {!result.bulkOperation ? (
                      <>
                        <TableHead>Operation</TableHead>
                        <TableHead>Record ID</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>SObject</TableHead>
                        <TableHead>Operation</TableHead>
                        <TableHead>Result</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!result.bulkOperation ? (
                    <TableRow>
                      <TableCell>{result.change}</TableCell>
                      <TableCell>{result.recordId || 'N/A'}</TableCell>
                    </TableRow>
                  ) : (
                    result.changedRecords.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{record.sobject}</TableCell>
                        <TableCell>{record.change}</TableCell>
                        <TableCell>{JSON.stringify(record.result)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )} */}

          {result && (
            <ExecutionResult result={result} />
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button className="px-3 py-1 rounded" variant={'outline_neutral'} onClick={handleCancel} disabled={executing}>Cancel</Button>
            <Button className="px-3 py-1 rounded " variant={'outline'} onClick={handleApprove} disabled={executing}>{executing ? 'Executing...' : 'Approve & Execute'}</Button>
          </div>
        </div>
    </div>
  );
}

const ExecutionResult = ({ result }: { result: SingleChangeResult | BulkChangeResult }) => {
  if (!result) return null;

  if (!result.bulkOperation) {
    return (
      <div>
        <div><strong>Operation:</strong> {result.change}</div>
        <div><strong>Record ID:</strong> {result.recordId || 'N/A'}</div>
      </div>
    );
  } else {
    return (
      <div>
        {result.changedRecords.map((record, index) => (
          <div key={index} className="mb-2">
            <div><strong>SObject:</strong> {record.sobject}</div>
            <div><strong>Operation:</strong> {record.change}</div>
            <div><strong>Result:</strong> {JSON.stringify(record.result)}</div>
          </div>
        ))}
      </div>
    );
  }
};