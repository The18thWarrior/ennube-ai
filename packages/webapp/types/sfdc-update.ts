// === sfdc-update.ts ===
// Created: 2025-09-06 00:00
// Purpose: Types for the update-data tool (proposals, validation, execution results)
// Exports:
//  - OperationType
//  - FieldChange
//  - RecordChange
//  - UpdateProposal
//  - ValidationError
//  - ExecutionResult
//  - ProposalResponse

export type OperationType = 'update' | 'delete' | 'create';

export type FieldChange = {
  fieldName: string;
  before?: unknown;
  after?: unknown;
};

export type RecordChange = {
  operationId: string;
  operation: OperationType;
  sobject: string;
  recordId?: string; // optional for create-like ops
  fields: FieldChange[];
  confidence?: number; // 0..1 confidence score from NLP
};

export type UpdateProposal = {
  proposalId: string;
  createdBy?: string; // user/agent id
  createdAt?: string; // ISO timestamp
  summary?: string;
  changes: RecordChange[];
  status?: 'draft' | 'proposed' | 'approved' | 'executing' | 'completed' | 'failed';
};

export type ValidationError = {
  code?: string;
  message: string;
  path?: string;
};

export type ExecutionResult = {
  operationId: string;
  success: boolean;
  message?: string;
  sfId?: string;
  error?: {
    code?: string;
    message: string;
  };
};

export type ProposalResponse = {
  proposal: UpdateProposal;
  validation: {
    ok: boolean;
    issues: ValidationError[];
  };
  status?: 'draft' | 'proposed' | 'approved' | 'executing' | 'completed' | 'failed';
};

/*
 * === sfdc-update.ts ===
 * Updated: 2025-09-06 00:00
 * Summary: Types for UpdateProposal, RecordChange, ValidationError, ExecutionResult
 */
