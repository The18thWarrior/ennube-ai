// === contract-result-card.tsx ===
// Created: 2025-07-29
// Purpose: Displays and allows editing of a single contract result record
// Exports:
//   - ContractResultCard
// Interactions:
//   - Uses: useContractResult hook
// Notes:
//   - Inline editing, validation, error handling

import React, { useState } from 'react';
import { ContractResult, useContractResult } from '@/hooks/useContractResult';
import { JsonRecord } from '../generalized-result';
import dayjs from 'dayjs';

interface ContractResultCardProps {
  result: ContractResult;
  onSave?: (updated: ContractResult) => void;
  onClose?: () => void;
}

/**
 * OVERVIEW
 *
 * - Purpose: Shows details and allows editing of a contract result.
 * - Assumptions: result prop is valid; editing allowed for contract_data and provider.
 * - Edge Cases: Invalid input, save errors, empty fields.
 * - How it fits: Used in detail views, modals, or cards for contract results.
 * - Future Improvements: Add field-level validation, better UX, loading states.
 */

export const ContractResultCard: React.FC<ContractResultCardProps> = ({ result, onSave, onClose }) => {
  const { updateResult, loading, error } = useContractResult();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<ContractResult>>({ ...result });
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleContractDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      setForm(f => ({ ...f, contract_data: JSON.parse(e.target.value) }));
    } catch {
      // ignore parse error for now
    }
  };

  const handleSave = async () => {
    if (!result.id) return;
    setSuccess(null);
    const ok = await updateResult(result.id, form);
    if (ok) {
      setEditMode(false);
      setSuccess('Contract result updated successfully.');
      if (onSave) onSave({ ...result, ...form });
    }
  };

  return (
    <div className="bg-background rounded-lg shadow p-6 w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300">Contract Result</h3>
        <div className="flex gap-2">
          {/* {!editMode ? (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
              onClick={() => setEditMode(true)}
            >Edit</button>
          ) : (
            <button
              className="bg-gray-300 hover:bg-muted text-muted-foreground text-sm px-4 py-2 rounded"
              onClick={() => { setEditMode(false); setForm({ ...result }); setSuccess(null); }}
            >Cancel</button>
          )} */}
          {typeof onClose === 'function' && (
            <button
              className="bg-gray-200 hover:bg-muted text-muted-foreground text-sm px-4 py-2 rounded"
              onClick={onClose}
              type="button"
              aria-label="Close"
            >
              Close
            </button>
          )}
        </div>
      </div>
      {success && <div className="mb-2 text-green-600 dark:text-green-400 text-sm">{success}</div>}
      {error && <div className="mb-2 text-red-500 dark:text-red-400 text-sm">{error}</div>}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Provider</label>
          {editMode ? (
            <select
              name="provider"
              value={form.provider || ''}
              onChange={handleChange}
              className="mt-1 block w-full outline outline-gray-300 dark:outline-gray-700   rounded px-3 py-2"
              required
            >
              <option value="">Select provider</option>
              <option value="sfdc">Salesforce</option>
              <option value="hubspot">HubSpot</option>
              <option value="gmail">Gmail</option>
              <option value="msoffice">MS Office</option>
            </select>
          ) : (
            <span className="text-muted-foreground ">{form.provider}</span>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Source ID</label>
          <input
            type="text"
            name="source_id"
            value={form.source_id || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline outline-gray-300 dark:outline-gray-700   rounded px-3 py-2"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground ">Contract Data (JSON)</label>
          {/* <textarea
            name="contract_data"
            value={JSON.stringify(form.contract_data, null, 2)}
            onChange={handleContractDataChange}
            disabled={!editMode}
            className="mt-1 block w-full outline outline-gray-300 dark:outline-gray-700   rounded px-3 py-2 font-mono text-sm"
            rows={15}
            required
          /> */}
          <JsonRecord
            data={form.contract_data}
            rootLabel='Contract Data'
            className="mt-1 block w-full shadow-none   rounded px-3 py-2 font-mono text-sm max-h-[50vh] overflow-auto"
          />
        </div>
        {editMode && (
          <div className="md:col-span-2 flex flex-row items-center gap-2 mt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-blue-100 font-medium px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
      <div className="mt-4 text-xs text-muted ">
        Created: {result.created_at ? dayjs(result.created_at).format('MMMM D, YYYY h:mm A') : '\u2014'}<br />
        Updated: {result.updated_at ? dayjs(result.updated_at).format('MMMM D, YYYY h:mm A') : '\u2014'}
      </div>
    </div>
  );
};

/**
 * Usage Example:
 *
 * <ContractResultCard result={result} onSave={handleSave} />
 */

/*
 * === contract-result-card.tsx ===
 * Updated: 2025-07-29
 * Summary: Card for viewing/editing a contract result
 * Key Components:
 *   - ContractResultCard: Main card component
 * Dependencies:
 *   - Requires: useContractResult hook, React
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Inline editing, validation, error handling
 */
