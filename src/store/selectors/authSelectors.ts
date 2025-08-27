import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selectors
export const selectAuthState = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectProfile = (state: RootState) => state.auth.profile;
export const selectAdminLevel = (state: RootState) => state.auth.adminLevel;

// Authentication selectors
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsInitialized = (state: RootState) => state.auth.initialized;

// Profile selectors
export const selectProfileLoaded = (state: RootState) => state.auth.profileLoaded;
export const selectHasCompleteProfile = createSelector(
  [selectProfile],
  (profile) => !!(profile?.full_name && profile?.role)
);

// Admin selectors
export const selectIsAdmin = (state: RootState) => state.auth.isAdmin;
export const selectIsSuperAdmin = (state: RootState) => state.auth.isSuperAdmin;
export const selectCanViewAdminDashboard = (state: RootState) => state.auth.canViewAdminDashboard;
export const selectCanManageAdmins = (state: RootState) => state.auth.canManageAdmins;

// Loading selectors
export const selectAuthLoading = (state: RootState) => state.auth.loading.auth;
export const selectProfileLoading = (state: RootState) => state.auth.loading.profile;
export const selectAdminLoading = (state: RootState) => state.auth.loading.admin;

export const selectAnyLoading = createSelector(
  [selectAuthLoading, selectProfileLoading, selectAdminLoading],
  (authLoading, profileLoading, adminLoading) => authLoading || profileLoading || adminLoading
);

export const selectIsLoadingComplete = createSelector(
  [selectIsInitialized, selectAnyLoading],
  (initialized, anyLoading) => initialized && !anyLoading
);

// Error selectors
export const selectAuthError = (state: RootState) => state.auth.error.auth;
export const selectProfileError = (state: RootState) => state.auth.error.profile;
export const selectAdminError = (state: RootState) => state.auth.error.admin;

export const selectAnyError = createSelector(
  [selectAuthError, selectProfileError, selectAdminError],
  (authError, profileError, adminError) => authError || profileError || adminError
);

// Combined selectors for common use cases
export const selectAuthStatus = createSelector(
  [
    selectIsAuthenticated,
    selectIsInitialized,
    selectAnyLoading,
    selectAnyError,
  ],
  (isAuthenticated, initialized, loading, error) => ({
    isAuthenticated,
    initialized,
    loading,
    error,
  })
);

export const selectUserInfo = createSelector(
  [selectUser, selectProfile, selectHasCompleteProfile],
  (user, profile, hasCompleteProfile) => ({
    user,
    profile,
    hasCompleteProfile,
    userId: user?.id,
    email: user?.email,
    fullName: profile?.full_name,
    role: profile?.role,
  })
);

export const selectAdminInfo = createSelector(
  [
    selectAdminLevel,
    selectIsAdmin,
    selectIsSuperAdmin,
    selectCanViewAdminDashboard,
    selectCanManageAdmins,
    selectAdminLoading,
    selectAdminError,
  ],
  (adminLevel, isAdmin, isSuperAdmin, canViewAdminDashboard, canManageAdmins, loading, error) => ({
    adminLevel,
    isAdmin,
    isSuperAdmin,
    canViewAdminDashboard,
    canManageAdmins,
    loading,
    error,
  })
);

// Onboarding selectors
export const selectNeedsOnboarding = createSelector(
  [
    selectIsAuthenticated,
    selectIsInitialized,
    selectHasCompleteProfile,
    selectAnyLoading,
  ],
  (isAuthenticated, initialized, hasCompleteProfile, loading) => {
    // Only determine onboarding need if fully loaded
    if (!initialized || loading) {
      return false;
    }
    
    return isAuthenticated && !hasCompleteProfile;
  }
);

// Route protection selectors
export const selectCanAccessRoute = createSelector(
  [selectIsAuthenticated, selectIsLoadingComplete],
  (isAuthenticated, loadingComplete) => ({
    canAccess: isAuthenticated && loadingComplete,
    shouldRedirect: loadingComplete && !isAuthenticated,
    isLoading: !loadingComplete,
  })
);

export const selectCanAccessAdminRoute = createSelector(
  [selectCanViewAdminDashboard, selectIsLoadingComplete],
  (canViewAdminDashboard, loadingComplete) => ({
    canAccess: canViewAdminDashboard && loadingComplete,
    shouldRedirect: loadingComplete && !canViewAdminDashboard,
    isLoading: !loadingComplete,
  })
);

export const selectCanAccessSuperAdminRoute = createSelector(
  [selectIsSuperAdmin, selectIsLoadingComplete],
  (isSuperAdmin, loadingComplete) => ({
    canAccess: isSuperAdmin && loadingComplete,
    shouldRedirect: loadingComplete && !isSuperAdmin,
    isLoading: !loadingComplete,
  })
);
