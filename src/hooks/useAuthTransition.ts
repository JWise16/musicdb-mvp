/**
 * Transition helper that allows gradual migration from old auth system to Redux
 * Change USE_REDUX_AUTH to switch between implementations
 */

// Feature flag for gradual rollout
const USE_REDUX_AUTH = true; // Enable Redux auth for testing

// Original hooks
import { useAuth as useAuthOriginal } from './useAuth';
import { useUserProfile as useUserProfileOriginal } from './useUserProfile';
import { useAdminAuth as useAdminAuthOriginal } from './useAdminAuth';

// Redux hooks
import { useAuth as useAuthRedux } from './useAuthRedux';
import { useUserProfile as useUserProfileRedux } from './useUserProfileRedux';
import { useAdminAuth as useAdminAuthRedux } from './useAdminAuthRedux';

// Export the appropriate hooks based on feature flag
export const useAuth = USE_REDUX_AUTH ? useAuthRedux : useAuthOriginal;
export const useUserProfile = USE_REDUX_AUTH ? useUserProfileRedux : useUserProfileOriginal;
export const useAdminAuth = USE_REDUX_AUTH ? useAdminAuthRedux : useAdminAuthOriginal;
