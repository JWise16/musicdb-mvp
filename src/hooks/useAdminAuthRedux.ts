import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { fetchAdminStatus } from '../store/slices/authSlice';
import {
  selectUser,
  selectAdminInfo,
  selectAuthLoading,
} from '../store/selectors/authSelectors';

/**
 * Redux-based admin auth hook to replace the original useAdminAuth hook
 * This eliminates race conditions and provides consistent admin state
 */
export const useAdminAuth = () => {
  const dispatch = useAppDispatch();
  
  // Get state from Redux
  const user = useAppSelector(selectUser);
  const authLoading = useAppSelector(selectAuthLoading);
  const {
    adminLevel,
    isAdmin,
    isSuperAdmin,
    canViewAdminDashboard,
    canManageAdmins,
    loading: adminLoading,
    error,
  } = useAppSelector(selectAdminInfo);

  // Refetch admin status manually if needed
  const refetchAdminStatus = useCallback(async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    const result = await dispatch(fetchAdminStatus(user.id));
    if (fetchAdminStatus.rejected.match(result)) {
      const errorPayload = result.payload as { message?: string } | undefined;
      throw new Error(errorPayload?.message || 'Failed to fetch admin status');
    }
    
    return result.payload;
  }, [dispatch, user?.id]);

  return {
    user,
    isAdmin,
    adminLevel,
    isSuperAdmin,
    canManageAdmins,
    canViewAdminDashboard,
    loading: authLoading || adminLoading,
    error,
    refetchAdminStatus,
  };
};
