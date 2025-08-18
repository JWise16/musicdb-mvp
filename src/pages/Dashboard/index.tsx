import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useVenue } from '../../contexts/VenueContext';
import { VenueService, type VenueAnalytics, type VenueEvent } from '../../services/venueService';
import Sidebar from '../../components/layout/Sidebar';
import VenueSelector from '../../components/features/venues/VenueSelector';
import TimeFrameSelector from '../../components/features/dashboard/TimeFrameSelector';
import AnalyticsCards from '../../components/features/dashboard/AnalyticsCards';
import EventAnalytics from '../../components/features/dashboard/EventAnalytics';
import YourShows from '../../components/features/dashboard/YourShows';
import { Button } from '../../components/common/Button';
import logo from '../../assets/logo.png';

const Dashboard = () => {
  //console.log('Dashboard: Component rendered - START');
  
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { currentVenue, hasUserVenues: contextHasVenues, isLoading: venueLoading } = useVenue();
  const navigate = useNavigate();
  const [hasVenues, setHasVenues] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'YTD' | 'MTD' | 'ALL'>('YTD');
  const [analytics, setAnalytics] = useState<VenueAnalytics>(() => VenueService.getDefaultAnalytics());
  const [events, setEvents] = useState<{ upcoming: VenueEvent[]; past: VenueEvent[] }>({
    upcoming: [],
    past: []
  });

  // Only log state changes when there's an actual change to avoid spam
  const stateRef = useRef<string>('');
  const currentState = JSON.stringify({ 
    user: user?.email, 
    authLoading, 
    profileLoading,
    profile: profile ? { full_name: profile.full_name, role: profile.role } : null,
    currentVenue: currentVenue?.name,
    venueLoading 
  });
  
  if (stateRef.current !== currentState) {
    console.log('Dashboard: Hooks state changed', JSON.parse(currentState));
    stateRef.current = currentState;
  }

  // Check if user needs onboarding
  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.error('Dashboard: Loading timeout reached after 15 seconds');
      console.error('Dashboard: Final state at timeout:', { 
        user: user?.email, 
        authLoading, 
        profileLoading, 
        profile: profile ? 'exists' : 'null',
        venueLoading,
        hasVenues 
      });
      
      // If we're still stuck on profile loading, force it to complete
      if (profileLoading) {
        console.error('Dashboard: Profile still loading after timeout, this indicates a bug in useUserProfile');
      }
      
      // Force navigation to onboarding to prevent infinite loading
      setHasVenues(false);
      navigate('/onboarding');
    }, 15000); // 15 second timeout

    const checkOnboardingNeeded = async () => {
      console.log('Dashboard: Starting onboarding check', { 
        user: user?.email,
        authLoading,
        profile: profile ? { full_name: profile.full_name, role: profile.role } : 'null', 
        profileLoading,
        venueLoading
      });
      
      // Wait for auth to complete first
      if (authLoading) {
        console.log('Dashboard: Auth still loading, waiting...');
        return;
      }

      if (!user) {
        console.log('Dashboard: No user, redirecting to login');
        clearTimeout(timeout);
        navigate('/login');
        return;
      }

      // Wait for profile loading to complete
      if (profileLoading) {
        console.log('Dashboard: Profile still loading, waiting...');
        return;
      }

      // Check if profile is complete
      const hasProfile = !!(profile?.full_name && profile?.role);
      console.log('Dashboard: Profile check', { 
        hasProfile, 
        profile: profile ? { full_name: profile?.full_name, role: profile?.role } : null 
      });
      
      if (!hasProfile) {
        console.log('Dashboard: Profile incomplete, redirecting to onboarding');
        clearTimeout(timeout);
        navigate('/onboarding');
        return;
      }

      // Wait for venue loading to complete
      if (venueLoading) {
        console.log('Dashboard: Venue loading in progress, waiting...');
        return;
      }

      try {
        // Use venue context instead of making individual API call
        const hasVenues = contextHasVenues;
        console.log('Dashboard: Venue check from context', { hasVenues, userId: user.id });
        
        if (!hasVenues) {
          console.log('Dashboard: No venues found, redirecting to onboarding');
          clearTimeout(timeout);
          navigate('/onboarding');
          return;
        }

        // Check if user has at least 3 events across all their venues
        const userVenues = await VenueService.getUserVenues(user.id);
        console.log('Dashboard: User venues', { userVenues: userVenues.map(v => ({ id: v.id, name: v.name })) });
        
        let totalEvents = 0;
        
        for (const venue of userVenues) {
          try {
            const venueEvents = await VenueService.getVenueEvents(venue.id);
            const venueEventCount = venueEvents.upcoming.length + venueEvents.past.length;
            totalEvents += venueEventCount;
            console.log(`Dashboard: Venue ${venue.name} has ${venueEventCount} events`);
          } catch (error) {
            console.error(`Error fetching events for venue ${venue.id}:`, error);
          }
        }
        
        console.log('Dashboard: Total events found:', totalEvents);
        
        if (totalEvents < 3) {
          console.log('Dashboard: Less than 3 events found, redirecting to onboarding');
          clearTimeout(timeout);
          navigate('/onboarding');
          return;
        }

        // If we get here, onboarding is complete
        console.log('Dashboard: Onboarding complete, setting hasVenues to true');
        clearTimeout(timeout);
        setHasVenues(hasVenues);
      } catch (error) {
        console.error('Dashboard: Error during onboarding check:', error);
        clearTimeout(timeout);
        // If there's an error, we might want to redirect to onboarding or show an error
        // For now, let's set hasVenues to false to prevent infinite loading
        setHasVenues(false);
      }
    };

    // Only proceed if we have a user and all loading states are complete
    if (!authLoading && user && !venueLoading && !profileLoading) {
      checkOnboardingNeeded();
    }

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timeout);
    };
  }, [user, profile, authLoading, profileLoading, venueLoading, navigate]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user || !hasVenues || !currentVenue) return;

      setIsLoading(true);
      try {
        // Load analytics for current venue
        const venueAnalytics = await VenueService.getVenueAnalytics(currentVenue.id, timeFrame);
        setAnalytics(venueAnalytics);

        // Load events for current venue
        const venueEvents = await VenueService.getVenueEvents(currentVenue.id);
        setEvents(venueEvents);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (hasVenues && currentVenue) {
      loadDashboardData();
    }
  }, [user, hasVenues, currentVenue, timeFrame]);

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleArtistClick = async (artistId: string) => {
    navigate(`/artist/${artistId}`);
  };

  const handleTimeFrameChange = (newTimeFrame: 'YTD' | 'MTD' | 'ALL') => {
    setTimeFrame(newTimeFrame);
  };

  // Show loading while checking onboarding or loading data
  if (authLoading || venueLoading || profileLoading || isLoading || hasVenues === null) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex items-center justify-center">
        <div className="text-center">
          <img 
            src={logo} 
            alt="MusicDB Logo" 
            className="w-24 h-24 mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-4 lg:p-8 overflow-hidden">
        <div className="rounded-3xl bg-white shadow-soft p-4 lg:p-8 min-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 lg:mb-8">
            <div className="min-w-0">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 truncate">Dashboard</h2>
              <p className="text-gray-600 truncate">
                {currentVenue 
                  ? `Analytics for ${currentVenue.name}`
                  : 'Welcome to your music venue dashboard'
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 min-w-0">
              <VenueSelector />
              <TimeFrameSelector 
                timeFrame={timeFrame} 
                onTimeFrameChange={handleTimeFrameChange} 
              />
              <Button 
                onClick={() => navigate('/add-event')}
                className="px-3 lg:px-4 py-2 bg-black hover:bg-gray-800 text-white focus:ring-gray-500 text-sm whitespace-nowrap"
              >
                + Add Event
              </Button>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="overflow-hidden">
            <AnalyticsCards analytics={analytics} />
          </div>

          {/* Charts and Events */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mt-6 lg:mt-8 overflow-hidden">
            <div className="min-w-0">
              <EventAnalytics analytics={analytics} />
            </div>
            <div className="min-w-0">
              <YourShows 
                upcoming={events.upcoming}
                past={events.past}
                onEventClick={handleEventClick}
                onArtistClick={handleArtistClick}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;