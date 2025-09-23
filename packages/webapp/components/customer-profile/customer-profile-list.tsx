// === customer-profile-list.tsx ===
// Created: 2025-07-24 15:30
// Purpose: Displays a list of customer profile records using useCustomerProfile hook
// Exports:
//   - CustomerProfileList
// Interactions:
//   - Uses: useCustomerProfile hook
// Notes:
//   - Follows UI/UX conventions from executions-list.tsx

import React, { useEffect } from 'react';
import { useCustomerProfile, CustomerProfile } from '@/hooks/useCustomerProfile';
import { CustomerProfileCard } from './customer-profile-card';
import { CustomerProfileCreateCard } from './customer-profile-create-card';

interface CustomerProfileListProps {
}

/**
 * OVERVIEW
 *
 * - Purpose: Renders a list of customer profiles for a given user.
 * - Assumptions: userId is provided and valid.
 * - Edge Cases: No profiles, loading/error states.
 * - How it fits: Used in account strategy, segmentation, analytics UI.
 * - Future Improvements: Add pagination, actions (edit/delete), search/filter.
 */

export const CustomerProfileList: React.FC<CustomerProfileListProps> = ({ }) => {
  const { profiles, loading, error, getProfiles } = useCustomerProfile();

  React.useEffect(() => {
    getProfiles();
  }, []);

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [selectedProfile, setSelectedProfile] = React.useState<CustomerProfile | null>(null);

  const handleCreateClick = () => setShowCreateModal(true);
  const handleProfileClick = (profile: CustomerProfile) => setSelectedProfile(profile);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customer Profiles</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded shadow"
          onClick={handleCreateClick}
        >
          + Create New Profile
        </button>
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Lifecycle</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Industries</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Products</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Regions</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin h-5 w-5 border-2  rounded-full border-t-transparent"></div>
                  </div>
                </td>
              </tr>
            ) : profiles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-muted-foreground ">
                  No customer profiles found
                </td>
              </tr>
            ) : (
              profiles.map((profile, index) => (
                <tr
                  key={profile.id || index}
                  className="hover:bg-muted/40  cursor-pointer"
                  onClick={() => handleProfileClick(profile)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {profile.customerProfileName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground ">
                    {profile.accountLifecycle || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground ">
                    {profile.commonIndustries || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground ">
                    {profile.frequentlyPurchasedProducts || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground ">
                    {profile.geographicRegions || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className={profile.active ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                      {profile.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-muted ">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for create profile */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-lg p-6 w-full max-w-3xl">
            <CustomerProfileCreateCard
              onCreated={() => { getProfiles(); setShowCreateModal(false); }}
              onClose={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}
      {/* Modal for profile detail */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-lg p-6 w-full max-w-3xl">
            <CustomerProfileCard
              profile={selectedProfile}
              onClose={() => setSelectedProfile(null)}
              onSave={updated => setSelectedProfile(updated)}
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
 * <CustomerProfileList userId={userId} />
 */

/*
 * === customer-profile-list.tsx ===
 * Updated: 2025-07-24 15:30
 * Summary: Lists customer profiles for a user
 * Key Components:
 *   - CustomerProfileList: Main list component
 * Dependencies:
 *   - Requires: useCustomerProfile hook, React
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Loading/error states, usage example included
 */
