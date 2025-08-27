import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuthTransition';
import { type EventFilters as EventFiltersType } from '../../services/eventService';
import { useEventsWithFiltering } from '../../hooks/useEventsWithFiltering';
import Sidebar from '../../components/layout/Sidebar';
import EventTable from '../../components/features/events/EventTable';
import EventFiltersComponent from '../../components/features/events/EventFilters';

const Events = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<EventFiltersType>({});

  // Use our new RTK Query hook with client-side filtering
  const hookResult = useEventsWithFiltering(filters);
  const filteredEvents = hookResult.events;
  const filterOptions = hookResult.filterOptions;
  const isLoading = hookResult.isLoading;
  const isRefetching = hookResult.isRefetching;
  const error = hookResult.error;
  const hasFilteredResults = hookResult.hasFilteredResults;
  const filteredCount = hookResult.filteredCount;
  const allEventsCount = hookResult.allEventsCount;

  const handleFilterChange = (newFilters: Partial<EventFiltersType>) => {
    console.log('Events page: Filter change (client-side):', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Show loading if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Please log in to view events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="rounded-3xl bg-white shadow-soft p-4 lg:p-8 min-h-[90vh] max-w-full">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 lg:mb-8">
            <div className="min-w-0">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 break-words">Events</h2>
              <p className="text-gray-600 break-words">
                Track and analyze your event performance
                {(allEventsCount as number) > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({filteredCount as number} of {allEventsCount as number} events)
                  </span>
                )}
              </p>
              {isRefetching === true && (
                <p className="text-sm text-blue-600 mt-1">
                  🔄 Refreshing data...
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4 min-w-0">
              <Link to="/add-event" className="btn-primary text-center whitespace-nowrap">
                Add Event
              </Link>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">
                Failed to load events. Please try refreshing the page.
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6">
            <EventFiltersComponent
              filters={filters}
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Events List */}
          <div className="w-full overflow-x-auto overflow-y-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading events...</p>
                </div>
              </div>
            ) : !hasFilteredResults ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                  </svg>
                </div>
                {allEventsCount === 0 ? (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
                    <p className="text-gray-600 mb-6">
                      Try adding some events to get started.
                    </p>
                    <Link to="/add-event" className="btn-primary">
                      Add an Event
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No events match your filters</h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your filters to see more events.
                    </p>
                    <button 
                      onClick={() => setFilters({})}
                      className="btn-secondary"
                    >
                      Clear All Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Performance indicator */}
                <div className="mb-4 text-sm text-gray-500">
                  ⚡ Instant filtering - {filteredCount} events loaded from cache
                </div>
                <EventTable events={filteredEvents} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Events;
