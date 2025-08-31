import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVenue } from '../../contexts/VenueContext';
import { 
  useGetVenueByIdQuery,
  useGetVenueAnalyticsQuery,
  useGetVenueEventsQuery
} from '../../store/api/venuesApi';
import { VenueService, type VenueAnalytics, type VenueEvent } from '../../services/venueService';
import Sidebar from '../../components/layout/Sidebar';
import VenueSelector from '../../components/features/venues/VenueSelector';
import TimeFrameSelector from '../../components/features/dashboard/TimeFrameSelector';
import AnalyticsCards from '../../components/features/dashboard/AnalyticsCards';
import EventAnalytics from '../../components/features/dashboard/EventAnalytics';
import YourShows from '../../components/features/dashboard/YourShows';
import type { Tables } from '../../database.types';

const VenueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { userVenues } = useVenue();
  const navigate = useNavigate();
  const [timeFrame, setTimeFrame] = useState<'YTD' | 'MTD' | 'ALL'>('YTD');

  // Use RTK Query for venue data
  const {
    data: venue,
    isLoading: venueLoading,
    error: venueError
  } = useGetVenueByIdQuery(id || '', {
    skip: !id
  });

  const {
    data: analytics = VenueService.getDefaultAnalytics(),
    isLoading: analyticsLoading
  } = useGetVenueAnalyticsQuery(
    { venueId: id || '', timeFrame },
    { skip: !id }
  );

  const {
    data: events = { upcoming: [], past: [] },
    isLoading: eventsLoading
  } = useGetVenueEventsQuery(id || '', {
    skip: !id
  });

  const isLoading = venueLoading || analyticsLoading || eventsLoading;

  // Check if user has access to this venue
  const hasAccess = venue && userVenues.some(uv => uv.id === venue.id);

  // Handle navigation if venue not found or user doesn't have access
  useEffect(() => {
    if (!id) {
      navigate('/venues');
      return;
    }

    if (venueError) {
      console.error('Error loading venue:', venueError);
      navigate('/venues');
      return;
    }

    if (venue && !hasAccess) {
      console.log('User does not have access to this venue');
      navigate('/venues');
      return;
    }
  }, [id, venue, venueError, hasAccess, navigate]);

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleTimeFrameChange = (newTimeFrame: 'YTD' | 'MTD' | 'ALL') => {
    setTimeFrame(newTimeFrame);
  };

  const getVenueSizeLabel = (capacity: number | null) => {
    if (!capacity) return 'Unknown';
    if (capacity <= 200) return 'Small';
    if (capacity <= 1000) return 'Medium';
    return 'Large';
  };

  const getVenueSizeColor = (capacity: number | null) => {
    if (!capacity) return 'bg-gray-100 text-gray-600';
    if (capacity <= 200) return 'bg-blue-100 text-blue-700';
    if (capacity <= 1000) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading venue details...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Venue Not Found</h3>
              <p className="text-gray-600 mb-6">The venue you're looking for doesn't exist.</p>
              <button onClick={() => navigate('/venues')} className="btn-primary">
                Back to Venues
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">{venue.name}</h2>
              <div className="flex items-center gap-4 text-gray-600">
                <span>{venue.location}</span>
                <span>•</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getVenueSizeColor(venue.capacity)}`}>
                  {getVenueSizeLabel(venue.capacity)}
                </span>
                {venue.capacity && (
                  <>
                    <span>•</span>
                    <span>{venue.capacity.toLocaleString()} capacity</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <VenueSelector />
              {hasAccess && (
                <TimeFrameSelector 
                  timeFrame={timeFrame} 
                  onTimeFrameChange={handleTimeFrameChange} 
                />
              )}
            </div>
          </div>

          {/* Venue Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Venue</h3>
                
                {venue.description && (
                  <p className="text-gray-600 mb-4">{venue.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{venue.address}</p>
                  </div>
                  
                  {venue.contact_email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Email</label>
                      <p className="text-gray-900">{venue.contact_email}</p>
                    </div>
                  )}
                  
                  {venue.contact_phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                      <p className="text-gray-900">{venue.contact_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.showsReported}
                  </div>
                  <div className="text-sm text-gray-600">Total Shows</div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${analytics.ticketSales.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Ticket Sales</div>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.avgSelloutRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Sellout Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics and Events (only show if user has access) */}
          {hasAccess ? (
            <>
              {/* Analytics Cards */}
              <AnalyticsCards analytics={analytics} />

              {/* Event Analytics */}
              <EventAnalytics analytics={analytics} />

              {/* Your Shows */}
              <YourShows 
                upcoming={events.upcoming}
                past={events.past}
                onEventClick={handleEventClick}
              />
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You need to be associated with this venue to view its analytics and events.
              </p>
              <button onClick={() => navigate('/verification')} className="btn-primary">
                Add This Venue to Your Account
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VenueDetails;
  