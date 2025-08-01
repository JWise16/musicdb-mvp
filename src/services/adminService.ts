import { supabase } from '../supabaseClient';

// Admin dashboard specific types
export interface UserStats {
  user_id: string;
  email: string;
  signup_date: string;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  profile_created: string | null;
  profile_updated: string | null;
  venue_count: number;
  venue_names: string | null;
  total_events: number;
  events_this_month: number;
  total_revenue: number;
  onboarding_status: 'profile_incomplete' | 'venue_needed' | 'events_needed' | 'complete';
  last_login: string | null;
  last_activity: string | null;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  newSignupsThisWeek: number;
  newSignupsThisMonth: number;
  onboardingCompletionRate: number;
  averageEventsPerUser: number;
  totalVenues: number;
  totalEvents: number;
  totalRevenue: number;
}

export interface OnboardingFunnelData {
  totalSignups: number;
  profileComplete: number;
  venueAdded: number;
  eventsReported: number;
  fullyComplete: number;
}

export interface UserActivityData {
  user_id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
  user_email: string;
  user_name: string | null;
}

export class AdminService {
  // Get all user statistics for admin dashboard
  static async getAllUserStats(): Promise<{ data: UserStats[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('admin_user_stats')
        .select('*')
        .order('signup_date', { ascending: false });

      if (error) {
        console.error('Error fetching user stats:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getAllUserStats:', error);
      return { data: null, error: 'Failed to fetch user statistics' };
    }
  }

  // Get dashboard overview statistics
  static async getDashboardStats(): Promise<{ data: AdminDashboardStats | null; error: string | null }> {
    try {
      const { data: userStats, error: userStatsError } = await this.getAllUserStats();
      
      if (userStatsError || !userStats) {
        return { data: null, error: userStatsError || 'Failed to fetch user stats' };
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalUsers = userStats.length;
      const activeUsers = userStats.filter(user => 
        user.last_activity && new Date(user.last_activity) > thirtyDaysAgo
      ).length;
      
      const newSignupsThisWeek = userStats.filter(user => 
        new Date(user.signup_date) > oneWeekAgo
      ).length;
      
      const newSignupsThisMonth = userStats.filter(user => 
        new Date(user.signup_date) > oneMonthAgo
      ).length;

      const completeUsers = userStats.filter(user => 
        user.onboarding_status === 'complete'
      ).length;
      
      const onboardingCompletionRate = totalUsers > 0 ? (completeUsers / totalUsers) * 100 : 0;
      
      const totalEvents = userStats.reduce((sum, user) => sum + user.total_events, 0);
      const averageEventsPerUser = totalUsers > 0 ? totalEvents / totalUsers : 0;
      
      const totalVenues = userStats.reduce((sum, user) => sum + user.venue_count, 0);
      const totalRevenue = userStats.reduce((sum, user) => sum + user.total_revenue, 0);

      const dashboardStats: AdminDashboardStats = {
        totalUsers,
        activeUsers,
        newSignupsThisWeek,
        newSignupsThisMonth,
        onboardingCompletionRate,
        averageEventsPerUser,
        totalVenues,
        totalEvents,
        totalRevenue
      };

      return { data: dashboardStats, error: null };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return { data: null, error: 'Failed to calculate dashboard statistics' };
    }
  }

  // Get onboarding funnel data
  static async getOnboardingFunnelData(): Promise<{ data: OnboardingFunnelData | null; error: string | null }> {
    try {
      const { data: userStats, error: userStatsError } = await this.getAllUserStats();
      
      if (userStatsError || !userStats) {
        return { data: null, error: userStatsError || 'Failed to fetch user stats' };
      }

      const totalSignups = userStats.length;
      const profileComplete = userStats.filter(user => 
        user.full_name && user.role
      ).length;
      const venueAdded = userStats.filter(user => 
        user.venue_count > 0
      ).length;
      const eventsReported = userStats.filter(user => 
        user.total_events > 0
      ).length;
      const fullyComplete = userStats.filter(user => 
        user.onboarding_status === 'complete'
      ).length;

      const funnelData: OnboardingFunnelData = {
        totalSignups,
        profileComplete,
        venueAdded,
        eventsReported,
        fullyComplete
      };

      return { data: funnelData, error: null };
    } catch (error) {
      console.error('Error in getOnboardingFunnelData:', error);
      return { data: null, error: 'Failed to calculate onboarding funnel data' };
    }
  }

  // Get recent user activity
  static async getRecentUserActivity(limit: number = 50): Promise<{ data: UserActivityData[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user activity:', error);
        return { data: null, error: error.message };
      }

      // Transform the data to match our interface
      const transformedData: UserActivityData[] = data?.map(activity => ({
        user_id: activity.user_id,
        activity_type: activity.activity_type,
        activity_data: activity.activity_data,
        created_at: activity.created_at,
        user_email: 'Unknown', // We'll need to join with users table for email
        user_name: null // We'll need to join with profiles table for name
      })) || [];

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error in getRecentUserActivity:', error);
      return { data: null, error: 'Failed to fetch user activity' };
    }
  }

  // Get user details by ID
  static async getUserDetails(userId: string): Promise<{ data: UserStats | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('admin_user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user details:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getUserDetails:', error);
      return { data: null, error: 'Failed to fetch user details' };
    }
  }

  // Search users by email or name
  static async searchUsers(query: string): Promise<{ data: UserStats[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('admin_user_stats')
        .select('*')
        .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .order('signup_date', { ascending: false });

      if (error) {
        console.error('Error searching users:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return { data: null, error: 'Failed to search users' };
    }
  }

  // Filter users by onboarding status
  static async getUsersByOnboardingStatus(status: UserStats['onboarding_status']): Promise<{ data: UserStats[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('admin_user_stats')
        .select('*')
        .eq('onboarding_status', status)
        .order('signup_date', { ascending: false });

      if (error) {
        console.error('Error filtering users by onboarding status:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getUsersByOnboardingStatus:', error);
      return { data: null, error: 'Failed to filter users by onboarding status' };
    }
  }

  // Record user activity (for frontend tracking)
  static async recordUserActivity(
    userId: string, 
    activityType: string, 
    activityData?: any
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_activity')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_data: activityData,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording user activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in recordUserActivity:', error);
      return { success: false, error: 'Failed to record user activity' };
    }
  }
}