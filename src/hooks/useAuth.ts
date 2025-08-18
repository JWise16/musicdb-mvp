// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { AdminService } from '../services/adminService';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //console.log('useAuth: Initializing auth state');
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('useAuth: Auth initialization taking longer than expected, forcing loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    // Get initial session
    const getInitialSession = async () => {
      //console.log('useAuth: Getting initial session');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        //console.log('useAuth: Initial session:', session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('useAuth: Error getting initial session:', error);
      } finally {
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      //console.log('useAuth: Auth state change:', event, session?.user?.email);
      clearTimeout(loadingTimeout); // Clear timeout since auth state is updating
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Track login activity (non-blocking)
      if (event === 'SIGNED_IN' && session?.user) {
        // Use setTimeout to make this truly non-blocking
        setTimeout(async () => {
          try {
            await AdminService.recordUserActivity(
              session.user.id, 
              'login',
              {
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                event_type: event
              }
            );
            console.log('useAuth: Login activity recorded for user:', session.user.email);
          } catch (error) {
            console.error('useAuth: Failed to record login activity:', error);
            // This is just tracking - don't let it affect the user experience
          }
        }, 0);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  //console.log('useAuth: Current state:', { user: user?.email, loading });

  return { user, loading };
};
