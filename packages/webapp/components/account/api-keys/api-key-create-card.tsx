// === api-key-create-card.tsx ===
// Created: 2025-08-17
// Purpose: Card component for generating a new API key
// Exports:
//   - ApiKeyCreateCard
// Interactions:
//   - Uses: useApiKeys hook
'use client'
import React, { useState } from 'react';
import useApiKeys from '@/hooks/useApiKeys';
import { useSnackbar } from 'notistack';

interface ApiKeyCreateCardProps {
  onCreated?: (createdId?: string) => void;
  onClose: () => void;
}

export const ApiKeyCreateCard: React.FC<ApiKeyCreateCardProps> = ({ onCreated, onClose }) => {
  const { createApiKey, loading, error } = useApiKeys();
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleCreate = async () => {
    setGeneratedToken(null);
    const created = await createApiKey();
    if (created) {
      setCreatedId(created.id);
      if (created.token) {
        setGeneratedToken(created.token);
        // Auto-hide after 30 seconds
        setTimeout(() => setGeneratedToken(null), 60000);
      }
      if (onCreated) {
        setTimeout(() => onCreated(created.id), 60000);
      }
    }
  };

  const handleCopy = () => {
    if (generatedToken) {
        navigator.clipboard.writeText(generatedToken);
        enqueueSnackbar('API key copied to clipboard', {
            variant: 'success',
            autoHideDuration: 4000
        });
    };
  };

  return (
    <div className="  rounded-lg shadow p-6 w-full mx-auto">
      <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-4">Generate API Key</h3>
      {generatedToken && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground ">Generated Key</label>
          <div className="mt-1 flex items-center gap-2">
            <input readOnly value={generatedToken} className="flex-1 px-3 py-2 rounded outline outline-gray-300 dark:outline-gray-700  " />
            <button className="bg-gray-200 hover:bg-muted text-muted-foreground px-3 py-2 rounded" onClick={handleCopy}>Copy</button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">Make sure to copy this key now — it will not be shown again.</div>
        </div>
      )}

      {error && <div className="mb-2 text-red-500 dark:text-red-400 text-sm">{error}</div>}

      <div className="flex gap-2">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-blue-100 font-medium px-4 py-2 rounded"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate & Create'}
        </button>
        <button
          type="button"
          className="bg-gray-300 hover:bg-muted text-muted-foreground    px-4 py-2 rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {createdId && <div className="mt-3 text-sm text-green-600 dark:text-green-400">API key record created (id: {createdId})</div>}
    </div>
  );
};

/*
 * === api-key-create-card.tsx ===
 * Updated: 2025-08-17
 * Summary: Card for creating an API key and displaying the generated token
 */