import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { UserProfileService } from '../services/userProfileService';
import type { Database } from '../types/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    //console.log('useUserProfile: fetchProfile called', { user: user?.email });
    
    if (!user) {
      //console.log('useUserProfile: No user, setting profile to null');
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      //console.log('useUserProfile: Fetching profile for user:', user.id);
      const result = await UserProfileService.getUserProfile(user.id);
      
      //console.log('useUserProfile: Profile fetch result:', result);
      
      if (result.error) {
        //console.log('useUserProfile: Profile fetch error:', result.error);
        setError(result.error);
        setProfile(null);
      } else {
        //
        // console.log('useUserProfile: Profile fetched successfully:', result.data);
        setProfile(result.data);
      }
    } catch (err) {
      console.error('useUserProfile: Error fetching user profile:', err);
      setError('Failed to fetch user profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

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

  // Fetch profile when user changes
  useEffect(() => {
    fetchProfile();
  }, [user]);

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