import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOnboarding } from '../../hooks/useOnboarding';
import { EventService, type EventFilters as EventFiltersType, type EventWithDetails } from '../../services/eventService';
import { VenueService } from '../../services/venueService';
import Sidebar from '../../components/layout/Sidebar';
import EventTable from '../../components/features/events/EventTable';
import EventFiltersComponent from '../../components/features/events/EventFilters';

const Events = () => {
  const { user } = useAuth();
  const { progress } = useOnboarding();
  const navigate = useNavigate();
  const [filteredEvents, setFilteredEvents] = useState<EventWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<EventFiltersType>({});
  const [filterOptions, setFilterOptions] = useState({
    genres: [] as string[],
    cities: [] as string[],
    venueSizes: [] as Array<{ value: string; label: string; count: number }>,
    venueHistogram: [] as number[]
  });
  
  // Verification states
  const [hasVenues, setHasVenues] = useState<boolean | null>(null);
  const [hasVenueEvents, setHasVenueEvents] = useState<boolean | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!hasVenues || !hasVenueEvents) return;
      
      try {
        const options = await EventService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadFilterOptions();
  }, [hasVenues, hasVenueEvents]);

  const handleFilterChange = (newFilters: Partial<EventFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Check user verification status
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user) return;
      
      setIsCheckingVerification(true);
      try {
        // Check if user has associated venues
        const userHasVenues = await VenueService.hasUserVenues(user.id);
        setHasVenues(userHasVenues);
        
        if (userHasVenues) {
          // Check if user's venues have any events
          const userVenues = await VenueService.getUserVenues(user.id);
          const venueEvents = await Promise.all(
            userVenues.map(venue => VenueService.getVenueEvents(venue.id))
          );
          
          // Check if any venue has events
          const hasEvents = venueEvents.some(events => 
            events.upcoming.length > 0 || events.past.length > 0
          );
          setHasVenueEvents(hasEvents);
        } else {
          setHasVenueEvents(false);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        setHasVenues(false);
        setHasVenueEvents(false);
      } finally {
        setIsCheckingVerification(false);
      }
    };

    checkVerificationStatus();
  }, [user]);

  useEffect(() => {
    const loadEvents = async () => {
      // Only load events if user is verified and their venue has events
      if (!user || !hasVenues || !hasVenueEvents) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Always force timeFrame to 'past' to exclude upcoming events
        const eventsData = await EventService.getEventsWithFilters({ timeFrame: 'past' });
        
        setFilteredEvents(eventsData);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [user, hasVenues, hasVenueEvents]);

  useEffect(() => {
    const applyFilters = async () => {
      // Only apply filters if we have events loaded
      if (!hasVenues || !hasVenueEvents) return;
      
      setIsLoading(true);
      try {
        // Always force timeFrame to 'past' to exclude upcoming events, regardless of user selection
        const filtersWithPastOnly = { ...filters, timeFrame: 'past' as const };
        const filteredData = await EventService.getEventsWithFilters(filtersWithPastOnly);
        setFilteredEvents(filteredData);
      } catch (error) {
        console.error('Error applying filters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    applyFilters();
  }, [filters, hasVenues, hasVenueEvents]);

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  // Show loading while checking verification
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Checking verification status...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show verification prompt if user has no venues
  if (!hasVenues) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Venue Verification Required</h3>
              <p className="text-gray-600 mb-6">
                To view events, you need to be associated with a venue. 
                Complete your venue verification to access the events database.
              </p>
              <Link to="/verification" className="btn-primary">
                Complete Verification
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show onboarding completion prompt if user's venue has no events
  if (!hasVenueEvents) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Onboarding</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Great! Your venue is verified. Now add your first {progress.totalEventsRequired} events to unlock access to the full events database and see events from other venues.
              </p>
              
              <div className="bg-purple-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-800">Progress</span>
                  <span className="text-sm text-purple-600">
                    {progress.eventsReported} / {progress.totalEventsRequired}
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((progress.eventsReported / progress.totalEventsRequired) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <Link to="/add-event" className="btn-primary">
                Add Your First Event
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show limited access message if user hasn't completed onboarding
  if (!progress.isComplete) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      Almost There! 🎯
                    </h3>
                    <p className="text-gray-600">
                      You're making great progress! Add {progress.totalEventsRequired - progress.eventsReported} more event{progress.totalEventsRequired - progress.eventsReported !== 1 ? 's' : ''} to unlock full access.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((progress.eventsReported / progress.totalEventsRequired) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        Events reported: {progress.eventsReported}/{progress.totalEventsRequired}
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((progress.eventsReported / progress.totalEventsRequired) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <Link to="/add-event" className="btn-primary text-sm px-4 py-2">
                    Add Event
                  </Link>
                </div>
              </div>
            </div>

            {/* Show limited events preview */}
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Events Database Preview</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Complete your onboarding to access the full events database with thousands of events from venues across the country.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show full events page for completed users
  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Events Database</h2>
              <p className="text-gray-600">
                Browse and discover events from venues across the country
              </p>
            </div>
            <Link to="/add-event" className="btn-primary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </Link>
          </div>

          {/* Filters */}
          <EventFiltersComponent
            filters={filters}
            onFilterChange={handleFilterChange}
            filterOptions={filterOptions}
          />

          {/* Events List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : filteredEvents.length > 0 ? (
            <EventTable
              events={filteredEvents}
              onEventClick={handleEventClick}
            />
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or add some events to get started.
              </p>
              <Link to="/add-event" className="btn-primary">
                Add an Event
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Events; 