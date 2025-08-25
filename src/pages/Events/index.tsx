import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { EventService, type EventFilters as EventFiltersType, type EventWithDetails } from '../../services/eventService';
import Sidebar from '../../components/layout/Sidebar';
import EventTable from '../../components/features/events/EventTable';
import EventFiltersComponent from '../../components/features/events/EventFilters';

const Events = () => {
  const { user } = useAuth();

  const [filteredEvents, setFilteredEvents] = useState<EventWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<EventFiltersType>({});
  const [filterOptions, setFilterOptions] = useState({
    genres: [] as string[],
    cities: [] as string[],
    venueSizes: [] as Array<{ value: string; label: string; count: number }>,
    venueHistogram: [] as number[]
  });

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!user) return;
      
      try {
        const options = await EventService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadFilterOptions();
  }, [user]);

  const handleFilterChange = (newFilters: Partial<EventFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };



  useEffect(() => {
    const loadEvents = async () => {
      if (!user) {
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
  }, [user]);

  useEffect(() => {
    const applyFilters = async () => {
      if (!user) return;
      
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
  }, [filters, user]);




  // Show events page directly (onboarding ensures user has already completed requirements)
  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 min-w-0 ml-64 p-4 sm:p-6 lg:p-8">
        <div className="rounded-3xl bg-white shadow-soft p-4 sm:p-6 lg:p-8 min-h-[90vh] w-full overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Events Database</h2>
              <p className="text-gray-600 text-sm lg:text-base">
                Browse and discover events from venues across the country
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link to="/add-event" className="btn-primary flex items-center gap-2 text-sm lg:text-base px-4 py-2">
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Event
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 lg:mb-8">
            <EventFiltersComponent
              filters={filters}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions}
            />
          </div>

          {/* Events List */}
          <div className="w-full overflow-hidden">
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
        </div>
      </main>
    </div>
  );
};

export default Events; 