// === api-keys-list.tsx ===
// Created: 2025-08-17
// Purpose: Displays a list of API keys and exposes a modal to generate new keys
// Exports:
//   - ApiKeysList
// Interactions:
//   - Uses: useApiKeys hook
'use client'
import React from 'react';
import useApiKeys, { ApiKey } from '@/hooks/useApiKeys';
import { ApiKeyCreateCard } from './api-key-create-card';
import { useSnackbar } from 'notistack';

interface ApiKeysListProps {}

export const ApiKeysList: React.FC<ApiKeysListProps> = ({}) => {
  const { apiKeys, loading, error, deleteApiKey, fetchApiKeys, rotateApiKey } = useApiKeys();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [revealedToken, setRevealedToken] = React.useState<Record<string, string | null>>({});
  const { enqueueSnackbar } = useSnackbar();

  const handleCreateClick = () => setShowCreateModal(true);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    setDeletingId(id);
    const ok = await deleteApiKey(id);
    setDeletingId(null);
    if (!ok) alert('Failed to delete API key');
  };

  const handleRotate = async (id: string) => {
    if (!confirm('Rotate this API key? This will invalidate the previous token.')) return;
    const result = await rotateApiKey(id);
    if (result && result.token) {
      setRevealedToken(t => ({ ...t, [id]: result.token || null }));
      // Auto-hide after 30s
      setTimeout(() => setRevealedToken(t => ({ ...t, [id]: null })), 30000);
    } else {
      alert('Failed to rotate API key');
    }
  };

  const copyValue = (token: string) => {
    navigator.clipboard.writeText(token);
    enqueueSnackbar('API key copied to clipboard', {
            variant: 'success',
            autoHideDuration: 4000
        });
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <div className="flex gap-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded shadow"
            onClick={handleCreateClick}
          >
            + Generate API Key
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Updated</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                  </div>
                </td>
              </tr>
            ) : apiKeys.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No API keys found
                </td>
              </tr>
            ) : (
              apiKeys.map((key: ApiKey) => (
                <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">{key.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">{key.createdAt ? new Date(key.createdAt).toLocaleString() : '\u2014'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">{key.updatedAt ? new Date(key.updatedAt).toLocaleString() : '\u2014'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end gap-2">
                    <button
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-3 py-1 rounded"
                      onClick={() => navigator.clipboard.writeText(key.id)}
                      title="Copy ID"
                    >
                      Copy
                    </button>
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1 rounded"
                      onClick={() => handleRotate(key.id)}
                    >
                      Rotate
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
                      onClick={() => handleDelete(key.id)}
                      disabled={deletingId === key.id}
                    >
                      {deletingId === key.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-lg p-6 w-full max-w-3xl">
            <ApiKeyCreateCard
              onCreated={() => { fetchApiKeys(); setShowCreateModal(false); }}
              onClose={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}
      {/* Display revealed tokens */}
      {Object.entries(revealedToken).map(([id, token]) => token ? (
        <div key={id} className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 p-4 rounded shadow">
          <div className="text-sm font-medium">New token for {id}</div>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={token} className="px-3 py-2 rounded outline outline-gray-300 dark:outline-gray-700 dark:bg-gray-800 dark:text-gray-100" />
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded" onClick={() => copyValue(token)}>Copy</button>
          </div>
          <div className="text-xs text-gray-500 mt-2">This token will be hidden after 30 seconds.</div>
        </div>
      ) : null)}
    </div>
  );
};

/*
 * === api-keys-list.tsx ===
 * Updated: 2025-08-17
 * Summary: Lists API keys and provides create/delete actions
 */