import type { User } from '@supabase/supabase-js';
import type { Database } from '../database.types';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export type AdminLevel = 'admin' | 'super_admin' | null;

export interface AuthState {
  // User authentication
  user: User | null;
  isAuthenticated: boolean;
  
  // User profile
  profile: UserProfile | null;
  profileLoaded: boolean;
  
  // Admin status
  adminLevel: AdminLevel;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canViewAdminDashboard: boolean;
  canManageAdmins: boolean;
  
  // Loading states
  loading: {
    auth: boolean;
    profile: boolean;
    admin: boolean;
  };
  
  // Error states
  error: {
    auth: string | null;
    profile: string | null;
    admin: string | null;
  };
  
  // Initialization
  initialized: boolean;
}

export interface AuthError {
  code?: string;
  message: string;
  details?: any;
}
