// === useCustomerProfile.ts ===
// Created: 2025-07-24 15:15
// Purpose: React hook for CRUD operations on customer profiles via API
// Exports:
//   - useCustomerProfile
// Interactions:
//   - Uses: /app/api/customer-profile endpoint
// Notes:
//   - Type-safe, handles loading/error states, usage example included

import { useState, useCallback } from 'react';

export interface CustomerProfile {
  id?: string;
  userId: string;
  customerProfileName: string;
  commonIndustries: string;
  frequentlyPurchasedProducts: string;
  geographicRegions: string;
  averageDaysToClose: number;
  socialMediaPresence?: string;
  channelRecommendation?: string;
  accountStrategy?: string;
  accountEmployeeSize?: string;
  accountLifecycle?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * OVERVIEW
 *
 * - Purpose: Provides CRUD operations for customer profiles via API.
 * - Assumptions: API returns structured JSON, errors handled gracefully.
 * - Edge Cases: Network errors, missing fields, API failures.
 * - How it fits: Enables frontend components to manage customer profiles.
 * - Future Improvements: Add SWR/React Query, pagination, optimistic updates.
 */

export function useCustomerProfile() {
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all profiles for a user
  const getProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customer-profile`);
      const data = await res.json();
      if (res.ok) {
        setProfiles(data);
      } else {
        setError(data.error || 'Failed to fetch profiles');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Get a single profile by id
  const getProfile = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customer-profile?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
      } else {
        setError(data.error || 'Profile not found');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Create a new profile
  const createProfile = async (profileData: Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/customer-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (res.ok) {
        // Optionally fetch updated list
        await getProfiles();
        return data.id;
      } else {
        setError(data.error || 'Failed to create profile');
        return null;
      }
    } catch (err) {
      setError('Network error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing profile
  const updateProfile = async (id: string, updates: Partial<Omit<CustomerProfile, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/customer-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      const data = await res.json();
      if (res.ok) {
        await getProfiles();
        return true;
      } else {
        setError(data.error || 'Failed to update profile');
        return false;
      }
    } catch (err) {
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a profile
  const deleteProfile = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customer-profile?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        await getProfiles();
        return true;
      } else {
        setError(data.error || 'Failed to delete profile');
        return false;
      }
    } catch (err) {
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profiles,
    profile,
    loading,
    error,
    getProfiles,
    getProfile,
    createProfile,
    updateProfile,
    deleteProfile
  };
}

/**
 * Usage Example:
 *
 * const {
 *   profiles, profile, loading, error,
 *   getProfiles, getProfile, createProfile, updateProfile, deleteProfile
 * } = useCustomerProfile();
 *
 * useEffect(() => { getProfiles(); }, []);
 */

/*
 * === useCustomerProfile.ts ===
 * Updated: 2025-07-24 15:15
 * Summary: React hook for customer profile CRUD via API
 * Key Components:
 *   - useCustomerProfile: Main hook
 * Dependencies:
 *   - Requires: React
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Handles loading/error states, usage example included
 */
