// === customer-profile-create-card.tsx ===
// Created: 2025-07-24 16:00
// Purpose: Card component for creating a new customer profile
// Exports:
//   - CustomerProfileCreateCard
// Interactions:
//   - Uses: useCustomerProfile hook
// Notes:
//   - Handles form state, validation, and creation

import React, { useState } from 'react';
import { useCustomerProfile, CustomerProfile } from '@/hooks/useCustomerProfile';

interface CustomerProfileCreateCardProps {
  onCreated?: (profile: Omit<CustomerProfile, 'userId'>) => void;
  onClose: () => void;
}

/**
 * OVERVIEW
 *
 * - Purpose: Allows users to create a new customer profile record.
 * - Assumptions: All required fields must be filled.
 * - Edge Cases: Validation errors, API errors, duplicate names.
 * - How it fits: Used in modal for profile creation from list.
 * - Future Improvements: Add field-level validation, better UX, loading states.
 */

export const CustomerProfileCreateCard: React.FC<CustomerProfileCreateCardProps> = ({ onCreated, onClose }) => {
  const { createProfile, loading, error } = useCustomerProfile();
  const [form, setForm] = useState<Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>({
    customerProfileName: '',
    commonIndustries: '',
    frequentlyPurchasedProducts: '',
    geographicRegions: '',
    averageDaysToClose: 0,
    socialMediaPresence: '',
    channelRecommendation: '',
    accountStrategy: '',
    accountEmployeeSize: '',
    accountLifecycle: ''
  });
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    if (!form.customerProfileName) {
      setSuccess('Profile Name is required.');
      return;
    }
    const id = await createProfile(form);
    if (id) {
      setSuccess('Profile created successfully.');
      if (onCreated) onCreated({ ...form, id });
      setTimeout(onClose, 1000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 w-full mx-auto">
      <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-4">Create New Customer Profile</h3>
      {success && <div className="mb-2 text-green-600 dark:text-green-400 text-sm">{success}</div>}
      {error && <div className="mb-2 text-red-500 dark:text-red-400 text-sm">{error}</div>}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={handleSubmit}>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Name</label>
          <input
            type="text"
            name="customerProfileName"
            value={form.customerProfileName}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Industries</label>
          <input
            type="text"
            name="commonIndustries"
            value={form.commonIndustries}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. Finance;Healthcare"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Products</label>
          <input
            type="text"
            name="frequentlyPurchasedProducts"
            value={form.frequentlyPurchasedProducts}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. CRM;Analytics"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Regions</label>
          <input
            type="text"
            name="geographicRegions"
            value={form.geographicRegions}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. US;Europe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avg Days to Close</label>
          <input
            type="number"
            name="averageDaysToClose"
            value={form.averageDaysToClose}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Social Media Presence</label>
          <input
            type="text"
            name="socialMediaPresence"
            value={form.socialMediaPresence}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. Strong;Weak"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Channel Recommendation</label>
          <input
            type="text"
            name="channelRecommendation"
            value={form.channelRecommendation}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. Email;Phone"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Strategy</label>
          <textarea
            name="accountStrategy"
            value={form.accountStrategy}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee Size</label>
          <input
            type="text"
            name="accountEmployeeSize"
            value={form.accountEmployeeSize}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. 5-10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lifecycle</label>
          <input
            type="text"
            name="accountLifecycle"
            value={form.accountLifecycle}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded px-3 py-2"
            placeholder="e.g. Enterprise"
          />
        </div>
        <div className="md:col-span-2 flex flex-row items-center gap-2 mt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-blue-100 font-medium px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Profile'}
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
 * <CustomerProfileCreateCard onCreated={handleCreated} onClose={handleClose} />
 */

/*
 * === customer-profile-create-card.tsx ===
 * Updated: 2025-07-24 16:00
 * Summary: Card for creating a customer profile
 * Key Components:
 *   - CustomerProfileCreateCard: Main card component
 * Dependencies:
 *   - Requires: useCustomerProfile hook, React
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Form state, validation, error handling
 */
