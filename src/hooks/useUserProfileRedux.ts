import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { updateUserProfile, fetchUserProfile } from '../store/slices/authSlice';
import {
  selectProfile,
  selectProfileLoading,
  selectProfileError,
  selectProfileLoaded,
  selectUser,
} from '../store/selectors/authSelectors';
import type { UserProfile } from '../store/types';

/**
 * Redux-based user profile hook to replace the original useUserProfile hook
 * This eliminates race conditions and provides consistent profile state
 */
export const useUserProfile = () => {
  const dispatch = useAppDispatch();
  
  // Get profile state from Redux
  const profile = useAppSelector(selectProfile);
  const loading = useAppSelector(selectProfileLoading);
  const error = useAppSelector(selectProfileError);
  const profileLoaded = useAppSelector(selectProfileLoaded);
  const user = useAppSelector(selectUser);

  // Fetch profile manually if needed
  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    const result = await dispatch(fetchUserProfile(user.id));
    if (fetchUserProfile.rejected.match(result)) {
      const errorPayload = result.payload as { message?: string } | undefined;
      throw new Error(errorPayload?.message || 'Failed to fetch profile');
    }
    
    return result.payload;
  }, [dispatch, user?.id]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const result = await dispatch(updateUserProfile({ userId: user.id, updates }));
    
    if (updateUserProfile.rejected.match(result)) {
      const errorPayload = result.payload as { message?: string } | undefined;
      throw new Error(errorPayload?.message || 'Failed to update profile');
    }
    
    return true;
  }, [dispatch, user?.id]);

  // Update profile with avatar (placeholder for now - can implement later)
  const updateProfileWithAvatar = useCallback(async (
    updates: Partial<UserProfile>, 
    avatarFile?: File
  ) => {
    // For now, just update without avatar handling
    // This can be enhanced later with file upload logic
    console.log('Avatar file would be processed here:', avatarFile?.name);
    return updateProfile(updates);
  }, [updateProfile]);

  return {
    profile,
    loading,
    error,
    profileLoaded,
    fetchProfile,
    updateProfile,
    updateProfileWithAvatar,
    refetch: fetchProfile,
  };
};
