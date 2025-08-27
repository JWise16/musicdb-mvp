import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import { UserProfileService } from '../../services/userProfileService';
import { AdminService } from '../../services/adminService';
import type { AuthState, UserProfile, AdminLevel, AuthError } from '../types';

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  profile: null,
  profileLoaded: false,
  adminLevel: null,
  isAdmin: false,
  isSuperAdmin: false,
  canViewAdminDashboard: false,
  canManageAdmins: false,
  loading: {
    auth: true,
    profile: false,
    admin: false,
  },
  error: {
    auth: null,
    profile: null,
    admin: null,
  },
  initialized: false,
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      return {
        user: session?.user || null,
        session,
      };
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Failed to initialize auth',
        code: error.code,
        details: error,
      });
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const result = await UserProfileService.getUserProfile(userId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Failed to fetch user profile',
        details: error,
      });
    }
  }
);

export const fetchAdminStatus = createAsyncThunk(
  'auth/fetchAdminStatus',
  async (userId: string, { rejectWithValue }) => {
    try {
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('admin_level')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        if (error.code !== '406') { // 406 is "not acceptable" (not an admin)
          throw error;
        }
      }

      return adminData?.admin_level || null;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Failed to check admin status',
        code: error.code,
        details: error,
      });
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    { userId, updates }: { userId: string; updates: Partial<UserProfile> },
    { rejectWithValue }
  ) => {
    try {
      const result = await UserProfileService.updateUserProfile(userId, updates);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue({
        message: error.message || 'Failed to update profile',
        details: error,
      });
    }
  }
);

export const recordLoginActivity = createAsyncThunk(
  'auth/recordLoginActivity',
  async (
    { userId, userAgent }: { userId: string; userAgent: string },
    { rejectWithValue }
  ) => {
    try {
      await AdminService.recordUserActivity(userId, 'login', {
        timestamp: new Date().toISOString(),
        user_agent: userAgent,
        event_type: 'SIGNED_IN'
      });
    } catch (error: any) {
      // Don't fail the auth flow for activity tracking
      console.error('Failed to record login activity:', error);
      return rejectWithValue({
        message: 'Failed to record login activity',
        details: error,
      });
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      
      // Reset dependent state when user changes
      if (!action.payload) {
        state.profile = null;
        state.profileLoaded = false;
        state.adminLevel = null;
        state.isAdmin = false;
        state.isSuperAdmin = false;
        state.canViewAdminDashboard = false;
        state.canManageAdmins = false;
      }
    },
    
    setProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.profile = action.payload;
      state.profileLoaded = true;
    },
    
    setAdminLevel: (state, action: PayloadAction<AdminLevel>) => {
      state.adminLevel = action.payload;
      state.isAdmin = !!action.payload;
      state.isSuperAdmin = action.payload === 'super_admin';
      state.canViewAdminDashboard = !!action.payload;
      state.canManageAdmins = action.payload === 'super_admin';
    },
    
    clearAuthError: (state, action: PayloadAction<'auth' | 'profile' | 'admin'>) => {
      state.error[action.payload] = null;
    },
    
    clearAllErrors: (state) => {
      state.error = {
        auth: null,
        profile: null,
        admin: null,
      };
    },
    
    logout: (state) => {
      // Reset to initial state but keep initialized flag
      Object.assign(state, {
        ...initialState,
        initialized: true,
        loading: {
          auth: false,
          profile: false,
          admin: false,
        },
      });
    },
  },
  extraReducers: (builder) => {
    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading.auth = true;
        state.error.auth = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading.auth = false;
        state.user = action.payload.user;
        state.isAuthenticated = !!action.payload.user;
        state.initialized = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading.auth = false;
        state.initialized = true;
        state.error.auth = (action.payload as AuthError)?.message || 'Auth initialization failed';
      });

    // Fetch user profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading.profile = true;
        state.error.profile = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload;
        state.profileLoaded = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.profileLoaded = true;
        state.error.profile = (action.payload as AuthError)?.message || 'Profile fetch failed';
      });

    // Fetch admin status
    builder
      .addCase(fetchAdminStatus.pending, (state) => {
        state.loading.admin = true;
        state.error.admin = null;
      })
      .addCase(fetchAdminStatus.fulfilled, (state, action) => {
        state.loading.admin = false;
        state.adminLevel = action.payload;
        state.isAdmin = !!action.payload;
        state.isSuperAdmin = action.payload === 'super_admin';
        state.canViewAdminDashboard = !!action.payload;
        state.canManageAdmins = action.payload === 'super_admin';
      })
      .addCase(fetchAdminStatus.rejected, (state, action) => {
        state.loading.admin = false;
        state.error.admin = (action.payload as AuthError)?.message || 'Admin status check failed';
      });

    // Update user profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading.profile = true;
        state.error.profile = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error.profile = (action.payload as AuthError)?.message || 'Profile update failed';
      });
  },
});

export const {
  setUser,
  setProfile,
  setAdminLevel,
  clearAuthError,
  clearAllErrors,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
