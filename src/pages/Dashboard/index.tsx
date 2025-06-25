import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useVenue } from '../../contexts/VenueContext';
import { VenueService, type VenueAnalytics, type VenueEvent } from '../../services/venueService';
import Sidebar from '../../components/layout/Sidebar';
import VenueSelector from '../../components/features/venues/VenueSelector';
import TimeFrameSelector from '../../components/features/dashboard/TimeFrameSelector';
import AnalyticsCards from '../../components/features/dashboard/AnalyticsCards';
import EventAnalytics from '../../components/features/dashboard/EventAnalytics';
import YourShows from '../../components/features/dashboard/YourShows';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { progress } = useOnboarding();
  const { currentVenue, isLoading: venueLoading } = useVenue();
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

  // Check if user has venues and load data
  useEffect(() => {
    const checkVenuesAndLoadData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      setIsLoading(true);
      try {
        const hasUserVenues = await VenueService.hasUserVenues(user.id);
        setHasVenues(hasUserVenues);

        if (hasUserVenues && currentVenue) {
          // Load analytics for current venue
          const venueAnalytics = await VenueService.getVenueAnalytics(currentVenue.id, timeFrame);
          setAnalytics(venueAnalytics);

          // Load events for current venue
          const venueEvents = await VenueService.getVenueEvents(currentVenue.id);
          setEvents(venueEvents);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setHasVenues(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Only proceed if auth is complete and venue loading is complete
    if (user && !venueLoading) {
      checkVenuesAndLoadData();
    }
  }, [user, currentVenue, timeFrame, navigate, venueLoading]);

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleTimeFrameChange = (newTimeFrame: 'YTD' | 'MTD' | 'ALL') => {
    setTimeFrame(newTimeFrame);
  };

  const renderOnboardingProgress = () => {
    if (progress.isComplete) return null;

    return (
      <div className="card p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Setup</h3>
        <p className="text-gray-600 mb-4">
          Get the most out of MusicDB by completing these steps:
        </p>

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
                <span className="font-medium text-gray-900">Report your events</span>
                {progress.eventsReported >= progress.totalEventsRequired && (
                  <span className="text-green-600 text-sm font-medium">✓ Complete</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Add at least {progress.totalEventsRequired} events to unlock full access
              </p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{progress.eventsReported} / {progress.totalEventsRequired}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((progress.eventsReported / progress.totalEventsRequired) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            {progress.hasVenues && progress.eventsReported < progress.totalEventsRequired && (
              <Link to="/add-event" className="btn-primary text-sm px-4 py-2">
                Add Events
              </Link>
            )}
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
          {/* Show loading while auth or venues are being loaded */}
          {authLoading || venueLoading || isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h2>
                  <p className="text-gray-600">
                    {currentVenue 
                      ? `Analytics for ${currentVenue.name}`
                      : 'Welcome to your music venue dashboard'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <VenueSelector />
                  <TimeFrameSelector 
                    timeFrame={timeFrame} 
                    onTimeFrameChange={handleTimeFrameChange} 
                  />
                </div>
              </div>

              {/* Content */}
              {!hasVenues ? (
                // User has no venues - show onboarding
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to MusicDB!</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    To get started, you'll need to verify your venue. This helps us provide you with relevant analytics and insights.
                  </p>
                  <Link to="/verification" className="btn-primary px-6 py-3">
                    Verify Your Venue
                  </Link>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;