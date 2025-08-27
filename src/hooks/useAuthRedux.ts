import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { initializeAuth } from '../store/slices/authSlice';
import {
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectIsInitialized,
} from '../store/selectors/authSelectors';

/**
 * Redux-based auth hook to replace the original useAuth hook
 * This eliminates race conditions and provides consistent auth state
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  
  // Get auth state from Redux
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const initialized = useAppSelector(selectIsInitialized);

  // Initialize auth on first mount
  useEffect(() => {
    if (!initialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, initialized]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    initialized,
  };
};
