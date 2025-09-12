import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDownIcon, MapPinIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import PercentSoldDropdown from '../../common/PercentSoldDropdown';
import { useGetUserVenuesQuery, useGetVenueBookingIntelligenceQuery, useGetVenueGenresQuery } from '../../../store/api/venuesApi';
import { useAuth } from '../../../hooks/useAuth';

// Temporary inline types to avoid import issues
interface BookingIntelligenceMetrics {
  spotifyFollowers: number;
  youtubeSubscribers: number;
  instagramFollowers: number;
  tiktokFollowers: number;
  spotifyListenersLocal: number;
  totalPerformances: number;
  localPerformances: number;
}

interface BookingIntelligenceFilters {
  percentSoldRange: [number, number];
  genres: string[];
  timeFrame: 'month' | '3months' | '6months' | '12months' | 'all';
}

interface BookingIntelligenceData {
  metrics: BookingIntelligenceMetrics;
  artistCount: number;
  eventCount: number;
  dateRange: { from: string; to: string } | null;
  venue: { id: string; name: string; city: string };
  lastUpdated: string;
  appliedFilters: BookingIntelligenceFilters;
}



interface MetricRowData {
  platform: string;
  fanbase: number;
  rawValue: number;
  platformType: string;
}

// Placeholder data for development
const PLACEHOLDER_DATA: BookingIntelligenceData = {
  metrics: {
    spotifyFollowers: 125840,
    youtubeSubscribers: 89250,
    instagramFollowers: 204650,
    tiktokFollowers: 156730,
    spotifyListenersLocal: 8940,
    totalPerformances: 47,
    localPerformances: 23
  },
  artistCount: 15,
  eventCount: 32,
  dateRange: { from: '2024-01-01', to: '2025-09-11' },
  venue: {
    id: 'sample-venue-id',
    name: 'Sample Venue',
    city: 'New York'
  },
  lastUpdated: new Date().toISOString(),
  appliedFilters: {
    percentSoldRange: [0, 100],
    genres: [],
    timeFrame: 'all'
  }
};

// Format numbers for display
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

// Format date for display
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Platform Icons Components
const SpotifyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.6 0-.359.24-.66.54-.78 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const YouTubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

// Get platform icon component
const getPlatformIcon = (platform: string, className = "w-4 h-4") => {
  const lowerPlatform = platform.toLowerCase();
  
  if (lowerPlatform.includes('spotify')) {
    return <SpotifyIcon className={`${className} text-green-600`} />;
  } else if (lowerPlatform.includes('youtube')) {
    return <YouTubeIcon className={`${className} text-red-600`} />;
  } else if (lowerPlatform.includes('instagram')) {
    return <InstagramIcon className={`${className} text-pink-600`} />;
  } else if (lowerPlatform.includes('tiktok')) {
    return <TikTokIcon className={`${className} text-black`} />;
  } else if (lowerPlatform.includes('performances') && lowerPlatform.includes('(')) {
    return <MapPinIcon className={`${className} text-blue-600`} />;
  } else if (lowerPlatform.includes('performances')) {
    return <CalendarDaysIcon className={`${className} text-gray-600`} />;
  }
  
  return <CalendarDaysIcon className={`${className} text-gray-600`} />;
};

const BookingIntelligence = () => {
  const { user } = useAuth();
  
  // Filter state
  const [filters, setFilters] = useState<BookingIntelligenceFilters>({
    percentSoldRange: [0, 100],
    genres: [],
    timeFrame: 'all'
  });

  // Get user's venues to determine current venue
  const { data: userVenues = [] } = useGetUserVenuesQuery(user?.id || '', {
    skip: !user?.id,
  });

  // Use first venue as current venue (simplified for now)
  const currentVenue = userVenues[0] || null;

  // Get available genres for this venue
  const { data: availableGenres = [] } = useGetVenueGenresQuery(
    currentVenue?.id || '',
    {
      skip: !currentVenue?.id,
    }
  );

  // Get booking intelligence data using RTK Query
  const {
    data: bookingData,
    isLoading,
    error
  } = useGetVenueBookingIntelligenceQuery(
    {
      venueId: currentVenue?.id || '',
      filters
    },
    {
      skip: !currentVenue?.id,
      // Force refetch when filters change - no caching for now during debugging
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
      refetchOnFocus: false,
    }
  );

  // Debug: Log the error structure to understand what we're getting
  console.log('🔍 RTK Query State:', {
    bookingData,
    error,
    errorData: (error as any)?.data,
    errorCode: (error as any)?.data?.code,
    isLoading
  });

  // Check for NO_EVENTS error properly
  const isNoEventsError = error && (
    (error as any).data?.code === 'NO_EVENTS' ||
    (error as any).error?.includes('No events found') ||
    ((error as any).status === 'CUSTOM_ERROR' && (error as any).data?.code === 'NO_EVENTS')
  );

  // Use real data if available AND no current error, show empty state if no events match filters
  // Important: Even if old bookingData exists, prioritize showing empty state if current query failed
  const data = (bookingData && !isNoEventsError) ? bookingData : (isNoEventsError ? null : PLACEHOLDER_DATA);

  // Debug: Log when data changes
  console.log('🔍 BookingIntelligence Component State:', {
    currentFilters: filters,
    isLoading,
    hasBookingData: !!bookingData,
    isNoEventsError,
    usingPlaceholder: !bookingData && !isNoEventsError,
    dataIsNull: data === null,
    artistCount: data?.artistCount,
    eventCount: data?.eventCount
  });

  const timeFrameOptions = [
    { value: 'month' as const, label: 'This Month' },
    { value: '3months' as const, label: 'Last 3 Months' },
    { value: '6months' as const, label: 'Last 6 Months' },
    { value: '12months' as const, label: 'Last 12 Months' },
    { value: 'all' as const, label: 'All Time' }
  ];

  // Handle filter changes (RTK Query will automatically refetch when filters change)
  const handlePercentSoldChange = (range: [number, number]) => {
    console.log(`🎛️ Filter Change: Percent Sold changed from [${filters.percentSoldRange}] to [${range}]`);
    setFilters(prev => ({ ...prev, percentSoldRange: range }));
  };

  const handleTimeFrameChange = (timeFrame: typeof filters.timeFrame) => {
    console.log(`🎛️ Filter Change: Time Frame changed from "${filters.timeFrame}" to "${timeFrame}"`);
    setFilters(prev => ({ ...prev, timeFrame }));
  };


  // Early return for loading state (when no cached data exists)
  if (isLoading && !bookingData) {
    return (
      <div className="card p-4 sm:p-6 min-w-0 mb-6 lg:mb-8 overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Show no events found state (when filters exclude all events)
  if (!data) {
    return (
      <div className="card p-4 sm:p-6 min-w-0 mb-6 lg:mb-8 overflow-hidden">
        <div className="flex flex-col gap-4 mb-6">
          <h4 className="text-lg font-bold text-gray-900 shrink-0">Booking Intelligence</h4>
          
          {/* Show filters for context */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1 sm:min-w-[120px] sm:max-w-[140px]">
              <label className="block text-xs font-medium text-gray-700 mb-1 sm:hidden">% Sold</label>
              <PercentSoldDropdown 
                value={filters.percentSoldRange}
                onChange={handlePercentSoldChange}
              />
            </div>
            
            <div className="flex-1 sm:min-w-[140px] sm:max-w-[160px]">
              <label className="block text-xs font-medium text-gray-700 mb-1 sm:hidden">Time Frame</label>
              <select 
                value={filters.timeFrame}
                onChange={(e) => handleTimeFrameChange(e.target.value as typeof filters.timeFrame)}
                className="w-full px-2 py-2 pr-7 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              >
                {timeFrameOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {availableGenres.length > 0 && (
              <div className="flex-1 sm:min-w-[120px] sm:max-w-[160px]">
                <label className="block text-xs font-medium text-gray-700 mb-1 sm:hidden">Genre</label>
                <div className="relative">
                  <select 
                    value={filters.genres.length > 0 ? filters.genres[0] : ""}
                    onChange={(e) => {
                      if (e.target.value === "") {
                        setFilters(prev => ({ ...prev, genres: [] }));
                      } else {
                        setFilters(prev => ({ ...prev, genres: [e.target.value] }));
                      }
                    }}
                    className="w-full px-2 py-2 pr-7 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  >
                    <option value="">All Genres</option>
                    {availableGenres.map(genre => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Beautiful No Events State */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {/* Icon with gradient background */}
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.464-.881-6.084-2.327C7.896 15.691 9.84 16.5 12 16.5s4.104-.809 6.084-3.827z" />
              </svg>
            </div>
            {/* Subtle animation dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          </div>

          {/* Main message */}
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            No events match your filters
          </h3>
          
          <p className="text-gray-500 mb-8 max-w-sm">
            Try adjusting your filters to see booking intelligence data.
          </p>

          {/* Quick action button */}
          <button
            onClick={() => setFilters({ percentSoldRange: [0, 100], genres: [], timeFrame: 'all' })}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            🔄 Reset All Filters
          </button>
        </div>
      </div>
    );
  }

  // Show loading state with filters while new data loads (when we have cached data but a new query is loading)
  if (isLoading && data) {
    return (
      <div className="card p-4 sm:p-6 min-w-0 mb-6 lg:mb-8 overflow-hidden">
        <div className="flex flex-col gap-4 mb-6">
          <h4 className="text-lg font-bold text-gray-900 shrink-0">Booking Intelligence</h4>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Updating data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show no venue state
  if (!currentVenue) {
    return (
      <div className="card p-4 sm:p-6 min-w-0 mb-6 lg:mb-8 overflow-hidden">
        <div className="flex flex-col gap-4 mb-6">
          <h4 className="text-lg font-bold text-gray-900 shrink-0">Booking Intelligence</h4>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-600">No venue selected</p>
          <p className="text-sm text-gray-500 mt-1">Add a venue to see booking intelligence</p>
        </div>
      </div>
    );
  }

  // NOW SAFE TO COMPUTE METRICS - data is guaranteed to exist after all early returns

  // Prepare data for platform metrics table - filter out zero values for social media
  const allPlatformMetrics: MetricRowData[] = [
    { 
      platform: 'Spotify Followers', 
      fanbase: data.metrics.spotifyFollowers, 
      rawValue: data.metrics.spotifyFollowers, 
      platformType: 'spotify' 
    },
    { 
      platform: 'Youtube Subscribers', 
      fanbase: data.metrics.youtubeSubscribers, 
      rawValue: data.metrics.youtubeSubscribers, 
      platformType: 'youtube' 
    },
    { 
      platform: 'Instagram Followers', 
      fanbase: data.metrics.instagramFollowers, 
      rawValue: data.metrics.instagramFollowers, 
      platformType: 'instagram' 
    },
    { 
      platform: 'TikTok Followers', 
      fanbase: data.metrics.tiktokFollowers, 
      rawValue: data.metrics.tiktokFollowers, 
      platformType: 'tiktok' 
    },
    { 
      platform: `Spotify Listeners (${data.venue.city})`, 
      fanbase: data.metrics.spotifyListenersLocal, 
      rawValue: data.metrics.spotifyListenersLocal, 
      platformType: 'spotify_local' 
    }
  ];

  // Filter out social media metrics that are 0
  const platformMetrics = allPlatformMetrics.filter(metric => {
    // For social media metrics, only show if value > 0
    return metric.rawValue > 0;
  });

  // Prepare data for pie chart - only social media with values > 0
  const allPieData = [
    { name: 'Spotify', value: data.metrics.spotifyFollowers },
    { name: 'YouTube', value: data.metrics.youtubeSubscribers },
    { name: 'Instagram', value: data.metrics.instagramFollowers },
    { name: 'TikTok', value: data.metrics.tiktokFollowers },
  ];
  
  // Filter out zero values
  const pieChartData = allPieData.filter(item => item.value > 0);
  
  // Calculate total for percentages
  const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
  
  // Add percentage to each item
  const pieChartDataWithPercent = pieChartData.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
  }));

  // Define colors for pie chart segments to match Figma design
  const getPlatformColor = (platformName: string) => {
    switch (platformName) {
      case 'Spotify': return '#1DB954'; // Spotify Green
      case 'YouTube': return '#FF0000'; // YouTube Red
      case 'Instagram': return '#E1306C'; // Instagram Pink
      case 'TikTok': return '#000000'; // TikTok Black
      default: return '#6B7280'; // Gray fallback
    }
  };

  // Calculate total social media following
  const totalSocialFollowing = pieChartData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {formatNumber(data.value)} followers
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer for pie chart segments with icons
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name }: any) => {
    const RADIAN = Math.PI / 180;
    // Position icons in the middle of the donut thickness
    const radius = (innerRadius + outerRadius) / 2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const getIcon = (platformName: string) => {
      switch (platformName) {
        case 'Spotify':
          return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.6 0-.359.24-.66.54-.78 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          );
        case 'YouTube':
          return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          );
        case 'Instagram':
          return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          );
        case 'TikTok':
          return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          );
        default:
          return null;
      }
    };

    return (
      <g>
        <foreignObject x={x - 10} y={y - 10} width="20" height="20">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '20px', height: '20px' }}>
            {getIcon(name)}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="card p-4 sm:p-6 min-w-0 mb-6 lg:mb-8 overflow-hidden">
      {/* Header and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <h4 className="text-lg font-bold text-gray-900 shrink-0">Booking Intelligence</h4>
        
        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
          {/* Primary Filters Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-1">
            {/* Percent Sold Filter */}
            <div className="flex-1 sm:min-w-[120px] sm:max-w-[140px]">
              <label className="block text-xs font-medium text-gray-700 mb-1 sm:hidden">% Sold</label>
              <PercentSoldDropdown 
                value={filters.percentSoldRange}
                onChange={handlePercentSoldChange}
              />
            </div>
            
            {/* Time Frame Filter */}
            <div className="flex-1 sm:min-w-[140px] sm:max-w-[160px]">
              <label className="block text-xs font-medium text-gray-700 mb-1 sm:hidden">Time Frame</label>
              <div className="relative">
                <select 
                  value={filters.timeFrame}
                  onChange={(e) => handleTimeFrameChange(e.target.value as typeof filters.timeFrame)}
                  className="w-full px-2 py-2 pr-7 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 appearance-none"
                >
                  {timeFrameOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.value === 'month' ? 'This Month' :
                       option.value === '3months' ? '3 Months' :
                       option.value === '6months' ? '6 Months' :
                       option.value === '12months' ? '12 Months' :
                       'All Time'}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Genre Filter */}
            {availableGenres.length > 0 && (
              <div className="flex-1 sm:min-w-[120px] sm:max-w-[160px]">
                <label className="block text-xs font-medium text-gray-700 mb-1 sm:hidden">Genre</label>
                <div className="relative">
                  <select 
                    value={filters.genres.length > 0 ? filters.genres[0] : ""}
                    onChange={(e) => {
                      if (e.target.value === "") {
                        setFilters(prev => ({ ...prev, genres: [] }));
                      } else {
                        setFilters(prev => ({ ...prev, genres: [e.target.value] }));
                      }
                    }}
                    className="w-full px-2 py-2 pr-7 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 appearance-none"
                  >
                    <option value="">All Genres</option>
                    {availableGenres.map(genre => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-1.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">{data.artistCount}</span> artists • 
          <span className="font-medium ml-1">{data.eventCount}</span> events
          {data.dateRange && (
            <>
              {" • "}
              <span>{formatDate(data.dateRange.from)} - {formatDate(data.dateRange.to)}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: Average Artist Metrics */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Average Artist Metrics</h5>
          
          {/* Show message if no social media data is available */}
          {platformMetrics.filter(m => m.platformType !== 'performances' && m.platformType !== 'local_performances').length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">No social media data available</p>
              <p className="text-xs text-gray-500">Performance metrics shown below</p>
            </div>
          ) : null}
          
          {/* Metrics Cards */}
          <div className="space-y-3">
            {platformMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getPlatformIcon(metric.platform, "w-5 h-5")}
                  <span className="text-sm font-medium text-gray-900 min-w-0 flex-1">
                    {metric.platform}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-900 ml-3 shrink-0">
                  {formatNumber(metric.fanbase)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Social Media Distribution Pie Chart */}
        <div>
          {pieChartData.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center h-64 flex items-center justify-center">
              <div>
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 00-2-2m0 0V9a2 2 0 012-2h2a2 2 0 00-2-2" />
                </svg>
                <p className="text-sm text-gray-600">No social media data to display</p>
              </div>
            </div>
          ) : (
            <div className="h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={pieChartDataWithPercent}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={90}
                    innerRadius={55}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                  >
                    {pieChartDataWithPercent.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getPlatformColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center content - Total Fanbase */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatNumber(totalSocialFollowing)}
                  </div>
                  <div className="text-sm text-gray-600 leading-tight">
                    <div>Total</div>
                    <div>Fanbase</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingIntelligence;