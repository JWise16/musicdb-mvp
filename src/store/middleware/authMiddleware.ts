import { createListenerMiddleware } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../index';
import { supabase } from '../../supabaseClient';
import {
  setUser,
  fetchUserProfile,
  fetchAdminStatus,
  recordLoginActivity,
  logout,
} from '../slices/authSlice';

// Create the listener middleware
export const authListenerMiddleware = createListenerMiddleware();

// Type-safe listeners
const startAuthListener = authListenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

// Listen for auth state changes from Supabase
let authSubscription: any = null;

startAuthListener({
  predicate: (_action, currentState) => {
    // Only set up the listener once when the store is initialized
    return !authSubscription && currentState.auth.initialized;
  },
  effect: async (_action, listenerApi) => {
    const { dispatch } = listenerApi;

    // Set up Supabase auth state listener
    authSubscription = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);

        try {
          switch (event) {
            case 'SIGNED_IN':
            case 'INITIAL_SESSION':
              if (session?.user) {
                dispatch(setUser(session.user));
                
                // Fetch user profile and admin status in parallel
                const [profileResult, adminResult] = await Promise.allSettled([
                  dispatch(fetchUserProfile(session.user.id)).unwrap(),
                  dispatch(fetchAdminStatus(session.user.id)).unwrap(),
                ]);

                // Record login activity (non-blocking) - only for actual sign-ins, not initial sessions
                if (event === 'SIGNED_IN') {
                  dispatch(recordLoginActivity({
                    userId: session.user.id,
                    userAgent: navigator.userAgent,
                  }));
                }

                console.log('Auth state updated:', {
                  user: session.user.email,
                  event,
                  profile: profileResult.status === 'fulfilled' ? 'loaded' : 'failed',
                  admin: adminResult.status === 'fulfilled' ? 'loaded' : 'failed',
                });
              }
              break;

            case 'SIGNED_OUT':
              dispatch(logout());
              console.log('User signed out');
              break;

            case 'TOKEN_REFRESHED':
              // User is still authenticated, just refresh token
              if (session?.user) {
                dispatch(setUser(session.user));
                console.log('Token refreshed for:', session.user.email);
              }
              break;

            case 'USER_UPDATED':
              // User profile might have changed
              if (session?.user) {
                dispatch(setUser(session.user));
                console.log('User updated:', session.user.email);
              }
              break;

            default:
              console.log('Unhandled auth event:', event);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        }
      }
    );

    console.log('Auth state listener set up');
  },
});

// Listen for logout action to clean up
startAuthListener({
  actionCreator: logout,
  effect: async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      console.log('Supabase sign out completed');
    } catch (error) {
      console.error('Error during Supabase sign out:', error);
    }
  },
});

// Listen for user changes to fetch dependent data
startAuthListener({
  actionCreator: setUser,
  effect: async (action, listenerApi) => {
    const { dispatch, getState } = listenerApi;
    const user = action.payload;

    if (user && !getState().auth.profileLoaded) {
      // Fetch profile and admin status when user is set (but not already loaded)
      try {
        await Promise.all([
          dispatch(fetchUserProfile(user.id)),
          dispatch(fetchAdminStatus(user.id)),
        ]);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  },
});

// Export the middleware
export default authListenerMiddleware.middleware;
