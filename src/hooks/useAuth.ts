// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //console.log('useAuth: Initializing auth state');
    
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
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      //console.log('useAuth: Auth state change:', _event, session?.user?.email);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  //console.log('useAuth: Current state:', { user: user?.email, loading });

  return { user, loading };
};
