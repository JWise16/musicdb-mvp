import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';

// Removed unused interface

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLevel, setAdminLevel] = useState<'admin' | 'super_admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setAdminLevel(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user is admin by querying admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('admin_level')
        .eq('user_id', user.id)
        .single();

      if (adminError && adminError.code !== 'PGRST116') { // PGRST116 is "not found"
        // Only log error if it's not a 406 "not acceptable" error (which means user isn't admin)
        if (adminError.code !== '406') {
          console.error('Error checking admin status:', adminError);
          setError('Failed to check admin status');
        }
        setIsAdmin(false);
        setAdminLevel(null);
      } else if (adminData) {
        setIsAdmin(true);
        setAdminLevel(adminData.admin_level);
      } else {
        setIsAdmin(false);
        setAdminLevel(null);
      }
    } catch (err) {
      console.error('Error in checkAdminStatus:', err);
      setError('Failed to check admin status');
      setIsAdmin(false);
      setAdminLevel(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Use user.id instead of user object to prevent unnecessary re-renders

  useEffect(() => {
    if (!authLoading && user?.id) {
      checkAdminStatus();
    } else if (!authLoading && !user) {
      // No user, set defaults immediately
      setIsAdmin(false);
      setAdminLevel(null);
      setLoading(false);
    }
  }, [user?.id, authLoading]); // Remove checkAdminStatus from dependencies to prevent excessive calls

  const isSuperAdmin = adminLevel === 'super_admin';
  const canManageAdmins = isSuperAdmin;
  const canViewAdminDashboard = isAdmin;

  return {
    user,
    isAdmin,
    adminLevel,
    isSuperAdmin,
    canManageAdmins,
    canViewAdminDashboard,
    loading: authLoading || loading,
    error,
    refetchAdminStatus: checkAdminStatus
  };
};