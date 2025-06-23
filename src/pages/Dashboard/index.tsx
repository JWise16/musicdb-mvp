import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../hooks/useOnboarding';
import { VenueService, type VenueAnalytics, type VenueEvent } from '../../services/venueService';
import Sidebar from '../../components/layout/Sidebar';
import TimeFrameSelector from '../../components/features/dashboard/TimeFrameSelector';
import AnalyticsCards from '../../components/features/dashboard/AnalyticsCards';
import EventAnalytics from '../../components/features/dashboard/EventAnalytics';
import YourShows from '../../components/features/dashboard/YourShows';

const Dashboard = () => {
  const { user } = useAuth();
  const { progress } = useOnboarding();
  const navigate = useNavigate();
  const [hasVenues, setHasVenues] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'YTD' | 'MTD' | 'ALL'>('YTD');
  const [analytics, setAnalytics] = useState<VenueAnalytics>({
    showsReported: 0,
    ticketSales: 0,
    barSales: 0,
    avgSelloutRate: 0,
    avgTicketPrice: 0,
    topMonth: { month: 'N/A', count: 0 },
    topGenre: { genre: 'N/A', count: 0 },
    topArtist: { name: 'N/A', count: 0 }
  });
  const [events, setEvents] = useState<{ upcoming: VenueEvent[]; past: VenueEvent[] }>({
    upcoming: [],
    past: []
  });

  useEffect(() => {
    const checkUserVenues = async () => {
      console.log('Dashboard: checkUserVenues called', { user: user?.email, user_id: user?.id });
      if (!user) {
        console.log('Dashboard: No user, returning');
        return;
      }
      
      try {
        console.log('Dashboard: Calling VenueService.hasUserVenues');
        const hasUserVenues = await VenueService.hasUserVenues(user.id);
        console.log('Dashboard: hasUserVenues result:', hasUserVenues);
        setHasVenues(hasUserVenues);
      } catch (error) {
        console.error('Dashboard: Error checking user venues:', error);
        setHasVenues(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserVenues();
  }, [user]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user || !hasVenues) return;

      setIsLoading(true);
      try {
        const [analyticsData, eventsData] = await Promise.all([
          VenueService.getUserVenuesAnalytics(user.id, timeFrame),
          VenueService.getUserVenuesEvents(user.id)
        ]);

        setAnalytics(analyticsData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user, hasVenues, timeFrame]);

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleTimeFrameChange = (newTimeFrame: 'YTD' | 'MTD' | 'ALL') => {
    setTimeFrame(newTimeFrame);
  };

  const renderOnboardingProgress = () => {
    if (progress.isComplete) return null;

    return (
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Welcome to MusicDB! 🎵
              </h3>
              <p className="text-gray-600">
                Complete these steps to unlock all features and access the full events database.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(((progress.hasVenues ? 1 : 0) + (progress.eventsReported / progress.totalEventsRequired)) * 50)}%
              </div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Venue Verification Step */}
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                progress.hasVenues ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {progress.hasVenues ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Verify your venue</span>
                  {progress.hasVenues && (
                    <span className="text-green-600 text-sm font-medium">✓ Complete</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Search for your venue or create a new one</p>
              </div>
              {!progress.hasVenues && (
                <Link to="/verification" className="btn-primary text-sm px-4 py-2">
                  Verify Now
                </Link>
              )}
            </div>

            {/* Event Reporting Step */}
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                progress.eventsReported >= progress.totalEventsRequired ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {progress.eventsReported >= progress.totalEventsRequired ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    Report {progress.totalEventsRequired} events
                  </span>
                  {progress.eventsReported >= progress.totalEventsRequired && (
                    <span className="text-green-600 text-sm font-medium">✓ Complete</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">
                    Add your past or upcoming shows ({progress.eventsReported}/{progress.totalEventsRequired})
                  </p>
                  <div className="flex-1 max-w-32">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((progress.eventsReported / progress.totalEventsRequired) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              {progress.hasVenues && progress.eventsReported < progress.totalEventsRequired && (
                <Link to="/add-event" className="btn-primary text-sm px-4 py-2">
                  Add Event
                </Link>
              )}
            </div>

            {/* Completion Step */}
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                progress.isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {progress.isComplete ? '✓' : '3'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Access everything for free!</span>
                  {progress.isComplete && (
                    <span className="text-green-600 text-sm font-medium">✓ Unlocked</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Unlock all features and insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Venue Dashboard</h2>
              <div className="flex items-center gap-4 mt-2">
                <TimeFrameSelector 
                  timeFrame={timeFrame} 
                  onTimeFrameChange={handleTimeFrameChange} 
                />
              </div>
            </div>
            {!isLoading && (
              hasVenues ? (
                <Link to="/add-event" className="btn-primary flex items-center gap-2 text-lg px-6 py-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Add an event
                </Link>
              ) : (
                <button 
                  onClick={() => {
                    console.log('Dashboard: Complete Verification button clicked');
                    navigate('/verification');
                  }}
                  className="btn-primary flex items-center gap-2 text-lg px-6 py-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Complete Verification
                </button>
              )
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          ) : !hasVenues ? (
            // No venues associated - show verification prompt
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-blue-900">
                      Venue Verification Required
                    </h3>
                    <div className="mt-2 text-blue-800">
                      <p className="text-sm">
                        To add events to our database, you need to be associated with a venue. 
                        Click "Complete Verification" to search for your venue or create a new one.
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link to="/verification" className="btn-primary">
                        Complete Verification
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // User has venues - show dashboard content
            <>
              {/* Onboarding Progress */}
              {renderOnboardingProgress()}

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
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;