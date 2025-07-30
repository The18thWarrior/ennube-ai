// === contract-result-create-card.tsx ===
// Created: 2025-07-29
// Purpose: Card component for creating a new contract result
// Exports:
//   - ContractResultCreateCard
// Interactions:
//   - Uses: useContractResult hook
// Notes:
//   - Handles form state, validation, and creation

import React, { useState } from 'react';
import { useContractResult, ContractResult } from '@/hooks/useContractResult';

interface ContractResultCreateCardProps {
  onCreated?: (result: Omit<ContractResult, 'user_id'>) => void;
  onClose: () => void;
}

/**
 * OVERVIEW
 *
 * - Purpose: Allows users to create a new contract result record.
 * - Assumptions: All required fields must be filled.
 * - Edge Cases: Validation errors, API errors, duplicate source_id.
 * - How it fits: Used in modal for contract result creation from list.
 * - Future Improvements: Add field-level validation, better UX, loading states.
 */

export const ContractResultCreateCard: React.FC<ContractResultCreateCardProps> = ({ onCreated, onClose }) => {
  const { createResult, loading, error } = useContractResult();
  const [form, setForm] = useState<Omit<ContractResult, 'id' | 'created_at' | 'updated_at' | 'user_id'>>({
    source_id: '',
    provider: 'sfdc',
    contract_data: {},
  });
  const [contractDataText, setContractDataText] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleContractDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContractDataText(e.target.value);
    try {
      setForm(f => ({ ...f, contract_data: JSON.parse(e.target.value) }));
    } catch {
      // ignore parse error for now
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    if (!form.source_id || !form.provider) {
      setSuccess('Source ID and Provider are required.');
      return;
    }
    try {
      JSON.parse(contractDataText);
    } catch {
      setSuccess('Contract Data must be valid JSON.');
      return;
    }
    const id = await createResult(form);
    if (id) {
      setSuccess('Contract result created successfully.');
      if (onCreated) onCreated({ ...form, id });
      setTimeout(onClose, 1000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full mx-auto">
      <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-4">Create New Contract Result</h3>
      {success && <div className="mb-2 text-green-600 dark:text-green-400 text-sm">{success}</div>}
      {error && <div className="mb-2 text-red-500 dark:text-red-400 text-sm">{error}</div>}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
          <select
            name="provider"
            value={form.provider}
            onChange={handleChange}
            className="mt-1 block w-full outline outline-gray-300 dark:outline-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            required
          >
            <option value="sfdc">Salesforce</option>
            <option value="hubspot">HubSpot</option>
            <option value="gmail">Gmail</option>
            <option value="msoffice">MS Office</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Source ID</label>
          <input
            type="text"
            name="source_id"
            value={form.source_id}
            onChange={handleChange}
            className="mt-1 block w-full outline outline-gray-300 dark:outline-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contract Data (JSON)</label>
          <textarea
            name="contract_data"
            value={contractDataText}
            onChange={handleContractDataChange}
            className="mt-1 block w-full outline outline-gray-300 dark:outline-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2 font-mono"
            rows={6}
            required
            placeholder={'{\n  "field": "value"\n}'}
          />
        </div>
        <div className="md:col-span-2 flex flex-row items-center gap-2 mt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-blue-100 font-medium px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Contract Result'}
          </button>
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Usage Example:
 *
 * <ContractResultCreateCard onCreated={handleCreated} onClose={handleClose} />
 */

/*
 * === contract-result-create-card.tsx ===
 * Updated: 2025-07-29
 * Summary: Card for creating a contract result
 * Key Components:
 *   - ContractResultCreateCard: Main card component
 * Dependencies:
 *   - Requires: useContractResult hook, React
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Form state, validation, error handling
 */
