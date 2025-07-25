// === customer-profile-card.tsx ===
// Created: 2025-07-24 15:45
// Purpose: Displays and allows editing of a single customer profile record
// Exports:
//   - CustomerProfileCard
// Interactions:
//   - Uses: useCustomerProfile hook
// Notes:
//   - Inline editing, validation, error handling

import React, { useState } from 'react';
import { CustomerProfile, useCustomerProfile } from '@/hooks/useCustomerProfile';

interface CustomerProfileCardProps {
  profile: CustomerProfile;
  onSave?: (updated: CustomerProfile) => void;
  onClose?: () => void;
}

/**
 * OVERVIEW
 *
 * - Purpose: Shows details and allows editing of a customer profile.
 * - Assumptions: profile prop is valid; editing allowed for all fields.
 * - Edge Cases: Invalid input, save errors, empty fields.
 * - How it fits: Used in detail views, modals, or cards for customer profiles.
 * - Future Improvements: Add field-level validation, better UX, loading states.
 */

export const CustomerProfileCard: React.FC<CustomerProfileCardProps> = ({ profile, onSave, onClose }) => {
  const { updateProfile, loading, error } = useCustomerProfile();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<CustomerProfile>>({ ...profile });
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    if (!profile.id) return;
    setSuccess(null);
    const ok = await updateProfile(profile.id, form);
    if (ok) {
      setEditMode(false);
      setSuccess('Profile updated successfully.');
      if (onSave) onSave({ ...profile, ...form });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300">{form.customerProfileName || 'Untitled Profile'}</h3>
        <div className="flex gap-2">
          {!editMode ? (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
              onClick={() => setEditMode(true)}
            >Edit</button>
          ) : (
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm px-4 py-2 rounded"
              onClick={() => { setEditMode(false); setForm({ ...profile }); setSuccess(null); }}
            >Cancel</button>
          )}
          {/* Close button */}
          {typeof onClose === 'function' && (
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded"
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
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Name</label>
          <input
            type="text"
            name="customerProfileName"
            value={form.customerProfileName || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Industries</label>
          <input
            type="text"
            name="commonIndustries"
            value={form.commonIndustries || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. Finance;Healthcare"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Products</label>
          <input
            type="text"
            name="frequentlyPurchasedProducts"
            value={form.frequentlyPurchasedProducts || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. CRM;Analytics"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Regions</label>
          <input
            type="text"
            name="geographicRegions"
            value={form.geographicRegions || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. US;Europe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avg Days to Close</label>
          <input
            type="number"
            name="averageDaysToClose"
            value={form.averageDaysToClose ?? ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Social Media Presence</label>
          <input
            type="text"
            name="socialMediaPresence"
            value={form.socialMediaPresence || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. Strong;Weak"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Channel Recommendation</label>
          <input
            type="text"
            name="channelRecommendation"
            value={form.channelRecommendation || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. Email;Phone"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Strategy</label>
          <textarea
            name="accountStrategy"
            value={form.accountStrategy || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee Size</label>
          <input
            type="text"
            name="accountEmployeeSize"
            value={form.accountEmployeeSize || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. 5-10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lifecycle</label>
          <input
            type="text"
            name="accountLifecycle"
            value={form.accountLifecycle || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. Enterprise"
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
      <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
        Created: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}<br />
        Updated: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : '—'}
      </div>
    </div>
  );
};

/**
 * Usage Example:
 *
 * <CustomerProfileCard profile={profile} onSave={handleSave} />
 */

/*
 * === customer-profile-card.tsx ===
 * Updated: 2025-07-24 15:45
 * Summary: Card for viewing/editing a customer profile
 * Key Components:
 *   - CustomerProfileCard: Main card component
 * Dependencies:
 *   - Requires: useCustomerProfile hook, React
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Inline editing, validation, error handling
 */
