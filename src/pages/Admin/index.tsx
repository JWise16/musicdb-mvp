import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService, type AdminDashboardStats, type UserStats, type OnboardingFunnelData } from '../../services/adminService';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { supabase } from '../../supabaseClient';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

const StatCard = ({ title, value, subtext, trend, icon }: StatCardProps) => (
  <div className="bg-white rounded-lg shadow-soft p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtext && (
          <p className={`text-sm mt-1 ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {subtext}
          </p>
        )}
      </div>
      {icon && <div className="text-gray-400">{icon}</div>}
    </div>
  </div>
);

const OnboardingProgressBar = ({ label, count, total, color = 'blue' }: {
  label: string;
  count: number;
  total: number;
  color?: string;
}) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    indigo: 'bg-indigo-600'
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const UserRow = ({ user }: { user: UserStats }) => {
  const getStatusColor = (status: UserStats['onboarding_status']) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'events_needed': return 'bg-yellow-100 text-yellow-800';
      case 'venue_needed': return 'bg-orange-100 text-orange-800';
      case 'profile_incomplete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: UserStats['onboarding_status']) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'events_needed': return 'Needs Events';
      case 'venue_needed': return 'Needs Venue';
      case 'profile_incomplete': return 'Incomplete Profile';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {user.avatar_url ? (
              <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt="" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.full_name || 'No name'}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(user.signup_date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(user.last_activity)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.onboarding_status)}`}>
          {getStatusText(user.onboarding_status)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.venue_count}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.total_events}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${user.total_revenue.toLocaleString()}
      </td>
    </tr>
  );
};

export default function AdminDashboard() {
  const { user, adminLevel } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [funnelData, setFunnelData] = useState<OnboardingFunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<UserStats['onboarding_status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsResult, usersResult, funnelResult] = await Promise.all([
        AdminService.getDashboardStats(),
        AdminService.getAllUserStats(),
        AdminService.getOnboardingFunnelData()
      ]);

      if (statsResult.error) {
        throw new Error(statsResult.error);
      }
      if (usersResult.error) {
        throw new Error(usersResult.error);
      }
      if (funnelResult.error) {
        throw new Error(funnelResult.error);
      }

      setStats(statsResult.data);
      setUsers(usersResult.data || []);
      setFunnelData(funnelResult.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesStatus = filterStatus === 'all' || user.onboarding_status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-accent-600 text-white px-4 py-2 rounded-md hover:bg-accent-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">
                  Welcome back, {user?.email}
                  {adminLevel && (
                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {adminLevel === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={loadDashboardData}
                  className="bg-accent-600 text-white px-4 py-2 rounded-md hover:bg-accent-700 transition-colors"
                >
                  Refresh Data
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              subtext={`${stats.newSignupsThisMonth} new this month`}
              trend="up"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              subtext="Last 30 days"
            />
            <StatCard
              title="Onboarding Rate"
              value={`${stats.onboardingCompletionRate.toFixed(1)}%`}
              subtext="Completion rate"
            />
            <StatCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              subtext={`${stats.totalEvents} total events`}
            />
          </div>
        )}

        {/* Onboarding Funnel */}
        {funnelData && (
          <div className="bg-white rounded-lg shadow-soft p-6 border border-gray-100 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Onboarding Funnel</h3>
            <div className="space-y-4">
              <OnboardingProgressBar
                label="Signed Up"
                count={funnelData.totalSignups}
                total={funnelData.totalSignups}
                color="blue"
              />
              <OnboardingProgressBar
                label="Profile Complete"
                count={funnelData.profileComplete}
                total={funnelData.totalSignups}
                color="indigo"
              />
              <OnboardingProgressBar
                label="Venue Added"
                count={funnelData.venueAdded}
                total={funnelData.totalSignups}
                color="purple"
              />
              <OnboardingProgressBar
                label="Events Reported"
                count={funnelData.eventsReported}
                total={funnelData.totalSignups}
                color="yellow"
              />
              <OnboardingProgressBar
                label="Fully Complete"
                count={funnelData.fullyComplete}
                total={funnelData.totalSignups}
                color="green"
              />
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Users</h3>
              <div className="flex space-x-4">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                />
                
                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                >
                  <option value="all">All Status</option>
                  <option value="complete">Complete</option>
                  <option value="events_needed">Needs Events</option>
                  <option value="venue_needed">Needs Venue</option>
                  <option value="profile_incomplete">Incomplete Profile</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Events
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <UserRow key={user.user_id} user={user} />
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}