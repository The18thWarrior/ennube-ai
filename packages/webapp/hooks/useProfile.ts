'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserProfile } from '@/lib/db/account-storage';

interface UseProfileReturn {
  profile: Omit<UserProfile, 'updatedAt'> | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (profileData: Partial<Omit<UserProfile, 'email' | 'updatedAt'>>) => Promise<boolean>;
  isUpdating: boolean;
}

export function useProfile(): UseProfileReturn {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Omit<UserProfile, 'updatedAt'> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (status === 'loading' || !session?.user?.email) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/account/profile');
        
        if (!response.ok) {
          throw new Error('Failed to load profile data');
        }
        
        const profileData = await response.json();
        //console.log(profileData);
        setProfile(profileData);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load your profile information');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [session, status]);

  const updateProfile = async (profileData: Partial<Omit<UserProfile, 'email' | 'updatedAt'>>): Promise<boolean> => {
    if (!session?.user?.email) {
      setError('You must be logged in to update your profile');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(prev => ({ 
        ...prev, 
        ...updatedProfile
      }));
      
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update your profile information');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    isUpdating,
  };
}
