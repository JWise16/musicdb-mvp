import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { EventService, type EventFilters as EventFiltersType, type EventWithDetails } from '../../services/eventService';
import { VenueService } from '../../services/venueService';
import Sidebar from '../../components/layout/Sidebar';
import EventCard from '../../components/features/events/EventCard';
import EventFilters from '../../components/features/events/EventFilters';

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filteredEvents, setFilteredEvents] = useState<EventWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<EventFiltersType>({});
  const [filterOptions, setFilterOptions] = useState({
    genres: [] as string[],
    cities: [] as string[],
    venueSizes: [] as Array<{ value: string; label: string; count: number }>
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
        const eventsData = await EventService.getEventsWithFilters();
        
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
        const filteredData = await EventService.getEventsWithFilters(filters);
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

  // Show add event prompt if user's venue has no events
  if (!hasVenueEvents) {
    return (
      <div className="min-h-screen bg-[#F6F6F3] flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Your First Event</h3>
              <p className="text-gray-600 mb-6">
                Your venue is verified! Add your first event to start contributing to our events database 
                and see events from other venues.
              </p>
              <Link to="/add-event" className="btn-primary">
                Add an Event
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show events page (normal behavior)
  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Events</h2>
              <p className="text-gray-600">
                Discover music events from venues across the country
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setFilters({})}
                className="btn-secondary text-sm"
                disabled={Object.keys(filters).length === 0}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Filters */}
          <EventFilters
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
          />

          {/* Events Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-6">
                {Object.keys(filters).length > 0 
                  ? "Try adjusting your filters to see more events."
                  : "There are no events in the database yet."
                }
              </p>
              {Object.keys(filters).length > 0 && (
                <button
                  onClick={() => setFilters({})}
                  className="btn-primary"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => handleEventClick(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Events; 