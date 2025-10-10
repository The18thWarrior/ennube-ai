// === customer-profile-card.tsx ===
// Created: 2025-07-24 15:45
// Purpose: Displays and allows editing of a single customer profile record
// Exports:
//   - CustomerProfileCard
// Interactions:
//   - Uses: useCustomerProfile hook
// Notes:
//   - Inline editing, validation, error handling

"use client"

import React, { useState } from 'react';
import { CustomerProfile, useCustomerProfile } from '@/hooks/useCustomerProfile';
import { Button, Input, Textarea } from '../ui';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

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
  const { updateProfile, deleteProfile, loading, error } = useCustomerProfile();
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
    <div className="bg-popover rounded-lg shadow p-6 w-full mx-auto max-h-[98dvh] scrollbar overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{form.customerProfileName || 'Untitled Profile'}</h3>
        <div className="flex gap-2">
          {!editMode ? (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
              onClick={() => setEditMode(true)}
            >Edit</button>
          ) : (
            <button
              className="bg-gray-300 hover:bg-muted text-muted-foreground text-sm px-4 py-2 rounded"
              onClick={() => { setEditMode(false); setForm({ ...profile }); setSuccess(null); }}
            >Cancel</button>
          )}
          <button
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded"
            onClick={async () => { const ok = await deleteProfile(profile.id!); if (ok && onClose) onClose(); }}
            disabled={loading}
          >Delete</button>
          {/* Close button */}
          {typeof onClose === 'function' && (
            <Button
              variant="outline"
              className="text-sm px-4 py-2 rounded"
              onClick={onClose}
              type="button"
              aria-label="Close"
            >
              Close
            </Button>
          )}
        </div>
      </div>
      {success && <div className="mb-2 text-green-600 dark:text-green-400 text-sm">{success}</div>}
      {error && <div className="mb-2 text-red-500 dark:text-red-400 text-sm">{error}</div>}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Active</label>
          {editMode ? (
            <Select
              value={form.active ? 'true' : 'false'}
              onValueChange={(val: string) => setForm(f => ({ ...f, active: val === 'true' }))}
            >
              <SelectTrigger className="">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className={form.active ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
              {form.active ? 'Active' : 'Inactive'}
            </span>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground ">Profile Name</label>
          <Input
            type="text"
            name="customerProfileName"
            value={form.customerProfileName || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Industries</label>
          <Input
            type="text"
            name="commonIndustries"
            value={form.commonIndustries || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline rounded px-3 py-2"
            placeholder="e.g. Finance;Healthcare"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Products</label>
          <Input
            type="text"
            name="frequentlyPurchasedProducts"
            value={form.frequentlyPurchasedProducts || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline rounded px-3 py-2"
            placeholder="e.g. CRM;Analytics"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Regions</label>
          <Input
            type="text"
            name="geographicRegions"
            value={form.geographicRegions || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline rounded px-3 py-2"
            placeholder="e.g. US;Europe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Avg Days to Close</label>
          <Input
            type="number"
            name="averageDaysToClose"
            value={form.averageDaysToClose ?? ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline rounded px-3 py-2"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Social Media Presence</label>
          <Input
            type="text"
            name="socialMediaPresence"
            value={form.socialMediaPresence || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline rounded px-3 py-2"
            placeholder="e.g. Strong;Weak"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Channel Recommendation</label>
          <Input
            type="text"
            name="channelRecommendation"
            value={form.channelRecommendation || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline rounded px-3 py-2"
            placeholder="e.g. Email;Phone"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground ">Account Strategy</label>
          <Textarea
            name="accountStrategy"
            value={form.accountStrategy || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline rounded px-3 py-2"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Employee Size</label>
          <Input
            type="text"
            name="accountEmployeeSize"
            value={form.accountEmployeeSize || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline rounded px-3 py-2"
            placeholder="e.g. 5-10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground ">Lifecycle</label>
          <Input
            type="text"
            name="accountLifecycle"
            value={form.accountLifecycle || ''}
            onChange={handleChange}
            disabled={!editMode}
            className="mt-1 block w-full outline rounded px-3 py-2"
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
      <div className="mt-4 text-xs text-muted ">
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
