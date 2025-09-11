"use client";

// === update-data-review example page ===
// Created: 2025-09-10 12:30
// Purpose: Demo page to preview UpdateDataReviewModal with sample proposals

import React, { useState } from 'react';
import { UpdateDataReviewModal } from '../../../components/chat/tools/update-data-review-modal';
import type { UpdateProposal } from '@/types/sfdc-update';
import type { UIMessage } from 'ai';

export default function Page() {
  const [open, setOpen] = useState(true);

  const singleUpdate: UpdateProposal = {
    summary: 'Update phone for single account',
    changes: [
      {
        operationId: 'op-1',
        sobject: 'Account',
        operation: 'update',
        recordId: '0015000000zEM2QAAW',
        fields: [
          { fieldName: 'Name', before: 'PixelTag Test', after: 'PixelTag Test Updated' },
        ],
      },
    ],
  } as any;

  const batchCreate: UpdateProposal = {
    summary: 'Create three new contacts',
    changes: [
      {
        operationId: 'op-2',
        sobject: 'Contact',
        operation: 'create',
        fields: [
          { fieldName: 'FirstName', before: null, after: 'Alice' },
          { fieldName: 'LastName', before: null, after: 'Anderson' },
        ],
      },
      {
        operationId: 'op-3',
        sobject: 'Contact',
        operation: 'create',
        fields: [
          { fieldName: 'FirstName', before: null, after: 'Bob' },
          { fieldName: 'LastName', before: null, after: 'Baker' },
        ],
      },
      {
        operationId: 'op-4',
        sobject: 'Contact',
        operation: 'create',
        fields: [
          { fieldName: 'FirstName', before: null, after: 'Carol' },
          { fieldName: 'LastName', before: null, after: 'Carter' },
        ],
      },
    ],
  } as any;

  const deleteProposal: UpdateProposal = {
    summary: 'Delete an obsolete account',
    changes: [
      {
        operationId: 'op-5',
        sobject: 'Account',
        operation: 'delete',
        recordId: '001ZZZ',
        fields: [],
      },
    ],
  } as any;

  const completedProposal: UpdateProposal = {
    summary: 'Already executed proposal',
    changes: [],
  } as any;

  const fakeMessage: UIMessage = { parts: [] } as any;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">UpdateDataReviewModal — Examples</h1>

      <div>
        <h2 className="font-medium">Single update</h2>
        <UpdateDataReviewModal open={true} proposal={singleUpdate} message={fakeMessage} status="proposed" partId="p1" />
      </div>

      <div>
        <h2 className="font-medium">Batch create (multiple changes)</h2>
        <UpdateDataReviewModal open={true} proposal={batchCreate} message={fakeMessage} status="proposed" partId="p2" />
      </div>

      <div>
        <h2 className="font-medium">Delete proposal</h2>
        <UpdateDataReviewModal open={true} proposal={deleteProposal} message={fakeMessage} status="proposed" partId="p3" />
      </div>

      <div>
        <h2 className="font-medium">Completed proposal (read-only)</h2>
        <UpdateDataReviewModal open={true} proposal={completedProposal} message={fakeMessage} status="completed" partId="p4" />
      </div>
    </div>
  );
}

/*
 * === update-data-review example page ===
 * Updated: 2025-09-10 12:30
 */
