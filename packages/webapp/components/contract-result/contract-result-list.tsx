// === contract-result-list.tsx ===
// Created: 2025-07-29
// Purpose: Displays a list of contract result records using useContractResult hook
// Exports:
//   - ContractResultList
// Interactions:
//   - Uses: useContractResult hook
// Notes:
//   - Follows UI/UX conventions from customer-profile-list.tsx

import React, { useEffect } from 'react';
import { useContractResult, ContractResult } from '@/hooks/useContractResult';
import { ContractResultCard } from './contract-result-card';
import { ContractResultCreateCard } from './contract-result-create-card';
import dayjs from 'dayjs';
import { formatDistanceToNow } from 'date-fns';

interface ContractResultListProps {}

/**
 * OVERVIEW
 *
 * - Purpose: Renders a list of contract results for a given user.
 * - Assumptions: user is authenticated.
 * - Edge Cases: No results, loading/error states.
 * - How it fits: Used in contract analytics, admin, or integration UI.
 * - Future Improvements: Add pagination, actions (edit/delete), search/filter.
 */

export const ContractResultList: React.FC<ContractResultListProps> = ({ }) => {
  const { results, loading, error, getResults } = useContractResult();

  React.useEffect(() => {
    getResults();
  }, []);

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [selectedResult, setSelectedResult] = React.useState<ContractResult | null>(null);

  const handleCreateClick = () => setShowCreateModal(true);
  const handleResultClick = (result: ContractResult) => setSelectedResult(result);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contract Results</h1>
        {/* <button
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded shadow"
          onClick={handleCreateClick}
        >
          + Create New Contract Result
        </button> */}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-accent ">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Contract ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Result Id</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin h-5 w-5 border-2  rounded-full border-t-transparent"></div>
                  </div>
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-muted-foreground ">
                  No contract results found
                </td>
              </tr>
            ) : (
              results.map((result, index) => (
                <tr
                  key={result.id || index}
                  className="hover:bg-muted/40  cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {result.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground ">
                    {result.source_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-muted ">
                    {result.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-muted ">
                    {result.created_at ? formatDistanceToNow(dayjs(result.created_at).toDate(), { addSuffix: true }) : '\u2014'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for create contract result */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-lg p-6 w-full max-w-3xl">
            <ContractResultCreateCard
              onCreated={() => { getResults(); setShowCreateModal(false); }}
              onClose={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}
      {/* Modal for contract result detail */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-lg p-6 w-full max-w-3xl">
            <ContractResultCard
              result={selectedResult}
              onClose={() => setSelectedResult(null)}
              onSave={updated => setSelectedResult(updated)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Usage Example:
 *
 * <ContractResultList />
 */

/*
 * === contract-result-list.tsx ===
 * Updated: 2025-07-29
 * Summary: Lists contract results for a user
 * Key Components:
 *   - ContractResultList: Main list component
 * Dependencies:
 *   - Requires: useContractResult hook, React
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Loading/error states, usage example included
 */
