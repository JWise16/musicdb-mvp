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
let lastAuthEvent: { event: string; userId: string | null; timestamp: number } | null = null;

startAuthListener({
  predicate: (_action, currentState) => {
    // Only set up the listener once when the store is initialized
    return !authSubscription && currentState.auth.initialized;
  },
  effect: async (_action, listenerApi) => {
    const { dispatch, getState } = listenerApi;

    // Set up Supabase auth state listener
    authSubscription = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = getState().auth.user;
        const currentUserId = currentUser?.id || null;
        const newUserId = session?.user?.id || null;
        const now = Date.now();

        // More aggressive deduplication for tab switching
        if (lastAuthEvent && 
            lastAuthEvent.event === event && 
            lastAuthEvent.userId === newUserId &&
            (now - lastAuthEvent.timestamp) < 5000) { // 5 second debounce for tab switching
          console.log('Auth middleware: Skipping duplicate event (likely tab switch)', {
            event,
            userId: newUserId,
            timeSinceLastEvent: now - lastAuthEvent.timestamp
          });
          return;
        }

        // Additional check: if user is already authenticated and this is a SIGNED_IN event,
        // it's likely a tab switch, so skip processing
        if (event === 'SIGNED_IN' && currentUserId && currentUserId === newUserId) {
          console.log('Auth middleware: Skipping SIGNED_IN event for already authenticated user (tab switch)', {
            userId: newUserId,
            timeSinceLastEvent: lastAuthEvent ? now - lastAuthEvent.timestamp : 0
          });
          return;
        }

        lastAuthEvent = { event, userId: newUserId, timestamp: now };

        console.log('Auth state change:', event, session?.user?.email, {
          currentUserId,
          newUserId,
          timestamp: new Date().toISOString()
        });

        try {
          switch (event) {
            case 'SIGNED_IN':
            case 'INITIAL_SESSION':
              if (session?.user) {
                // Only update user if it actually changed
                if (currentUserId !== session.user.id) {
                  dispatch(setUser(session.user));
                }
                
                // Only fetch profile and admin status if not already loaded
                const currentState = getState();
                if (!currentState.auth.profileLoaded) {
                  const [profileResult, adminResult] = await Promise.allSettled([
                    dispatch(fetchUserProfile(session.user.id)).unwrap(),
                    dispatch(fetchAdminStatus(session.user.id)).unwrap(),
                  ]);

                  console.log('Auth state updated:', {
                    user: session.user.email,
                    event,
                    profile: profileResult.status === 'fulfilled' ? 'loaded' : 'failed',
                    admin: adminResult.status === 'fulfilled' ? 'loaded' : 'failed',
                  });
                } else {
                  console.log('Auth middleware: Profile already loaded, skipping fetch', {
                    user: session.user.email,
                    event
                  });
                }

                // Record login activity (non-blocking) - only for actual sign-ins, not initial sessions
                if (event === 'SIGNED_IN') {
                  dispatch(recordLoginActivity({
                    userId: session.user.id,
                    userAgent: navigator.userAgent,
                  }));
                }
              }
              break;

            case 'SIGNED_OUT':
              if (currentUserId) { // Only logout if we were actually logged in
                dispatch(logout());
                console.log('User signed out');
              }
              break;

            case 'TOKEN_REFRESHED':
              // User is still authenticated, just refresh token
              if (session?.user && currentUserId === session.user.id) {
                dispatch(setUser(session.user));
                console.log('Token refreshed for:', session.user.email);
              }
              break;

            case 'USER_UPDATED':
              // User profile might have changed
              if (session?.user && currentUserId === session.user.id) {
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
    const currentState = getState();

    if (user && !currentState.auth.profileLoaded) {
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
