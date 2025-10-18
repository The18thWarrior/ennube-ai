'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/db/account-storage';
import { useUser } from '@auth0/nextjs-auth0';

interface UseProfileReturn {
  profile: Omit<UserProfile, 'updatedAt'> | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (profileData: Partial<Omit<UserProfile, 'email' | 'updatedAt'>>) => Promise<boolean>;
  isUpdating: boolean;
}

export function useProfile(): UseProfileReturn {
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<Omit<UserProfile, 'updatedAt'> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (isUserLoading || !user?.email) {
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
        console.log('Error loading profile:', err);
        setError('Failed to load your profile information');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user, isUserLoading]);

  const updateProfile = async (profileData: Partial<Omit<UserProfile, 'email' | 'updatedAt'>>): Promise<boolean> => {
    if (!user?.email) {
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
      console.log('Error updating profile:', err);
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
