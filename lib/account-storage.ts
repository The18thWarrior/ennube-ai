/**
 * Utility functions for managing user profile information in Upstash Redis
 */
import { Redis } from '@upstash/redis';
import { Session } from 'next-auth';

// Create Redis client
const redis = Redis.fromEnv();

// Prefix for user profile data
const PROFILE_PREFIX = "user_profile:";

export interface UserProfile {
  name: string;
  email: string;
  company: string;
  jobRole: string;
  updatedAt: number;
}

/**
 * Save a user's profile information to Redis
 */
export async function saveUserProfile(userSub: string, profile: Omit<UserProfile, 'updatedAt'>): Promise<boolean> {
  try {
    if (!userSub) {
      console.error('Cannot save profile: No user ID provided');
      return false;
    }

    const key = `${PROFILE_PREFIX}${userSub}`;
    const profileData: UserProfile = {
      ...profile,
      updatedAt: Date.now()
    };
    
    await redis.set(key, JSON.stringify(profileData));
    console.log('Profile saved:', profileData);
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}

/**
 * Get a user's profile information from Redis
 * Falls back to session data if no saved profile exists
 */
export async function getUserProfile(userSub: string, session?: Session | null): Promise<UserProfile | null> {
  try {
    if (!userSub) {
      console.error('Cannot get profile: No user ID provided');
      return null;
    }
    
    const key = `${PROFILE_PREFIX}${userSub}`;
    const storedProfile = await redis.get<UserProfile>(key);
    
    return storedProfile;
    
    // If no profile is found but we have a session, create a default profile from session data
    // if (session?.user) {
    //   return {
    //     name: session.user.name || '',
    //     email: session.user.email || '',
    //     company: '',
    //     jobRole: '',
    //     updatedAt: Date.now()
    //   };
    // }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Update specific fields in a user's profile
 */
export async function updateUserProfile(
  userSub: string, 
  profileUpdates: Partial<Omit<UserProfile, 'email' | 'updatedAt'>>
): Promise<boolean> {
  try {
    if (!userSub) {
      console.error('Cannot update profile: No user ID provided');
      return false;
    }
    
    const key = `${PROFILE_PREFIX}${userSub}`;
    const currentProfile = await redis.get<UserProfile>(key);
    
    if (!currentProfile) {
      console.error('Cannot update profile: Profile not found');
      return false;
    }
    
    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...profileUpdates,
      updatedAt: Date.now()
    };
    
    await redis.set(key, JSON.stringify(updatedProfile));
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

/**
 * Delete a user's profile
 */
export async function deleteUserProfile(userSub: string): Promise<boolean> {
  try {
    if (!userSub) {
      console.error('Cannot delete profile: No user ID provided');
      return false;
    }
    
    const key = `${PROFILE_PREFIX}${userSub}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return false;
  }
}
