import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { UserProfileService } from '../services/userProfileService';
import type { Database } from '../types/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgressRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    console.log('useUserProfile: fetchProfile called', { 
      user: user?.email, 
      authLoading,
      fetchInProgress: fetchInProgressRef.current 
    });
    
    // Don't fetch if auth is still loading
    if (authLoading) {
      console.log('useUserProfile: Auth still loading, skipping fetch');
      return;
    }

    if (!user) {
      console.log('useUserProfile: No user, setting profile to null');
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Prevent multiple simultaneous fetches
    if (fetchInProgressRef.current) {
      console.log('useUserProfile: Fetch already in progress, skipping');
      return;
    }

    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('useUserProfile: Fetching profile for user:', user.id);
      const result = await UserProfileService.getUserProfile(user.id);
      
      console.log('useUserProfile: Profile fetch result:', result);
      
      if (result.error) {
        console.log('useUserProfile: Profile fetch error:', result.error);
        setError(result.error);
        setProfile(null);
      } else {
        console.log('useUserProfile: Profile fetched successfully:', result.data);
        setProfile(result.data);
        setError(null);
      }
    } catch (err) {
      console.error('useUserProfile: Error fetching user profile:', err);
      setError('Failed to fetch user profile');
      setProfile(null);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [user?.id, authLoading]); // Use user.id instead of user object to prevent unnecessary re-renders

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await UserProfileService.updateUserProfile(user.id, updates);
      
      if (result.error) {
        setError(result.error);
        return false;
      } else {
        setProfile(result.data);
        return true;
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Failed to update user profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfileWithAvatar = async (
    updates: Partial<UserProfile>, 
    avatarFile?: File
  ) => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await UserProfileService.updateProfileWithAvatar(
        user.id, 
        updates, 
        avatarFile
      );
      
      if (result.error) {
        setError(result.error);
        return false;
      } else {
        setProfile(result.data);
        return true;
      }
    } catch (err) {
      console.error('Error updating user profile with avatar:', err);
      setError('Failed to update user profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile when user ID changes or auth loading completes
  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchProfile();
    } else if (!authLoading && !user) {
      // Auth completed but no user - set state accordingly
      setProfile(null);
      setLoading(false);
      setError(null);
    }
  }, [user?.id, authLoading]); // Depend on user.id and authLoading, not the fetchProfile function

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    updateProfileWithAvatar,
    refetch: fetchProfile
  };
}; 