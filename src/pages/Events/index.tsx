import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { type EventFilters as EventFiltersType } from '../../services/eventService';
import { useEventsWithFiltering } from '../../hooks/useEventsWithFiltering';
import Sidebar from '../../components/layout/Sidebar';
import EventTable from '../../components/features/events/EventTable';
import EventFiltersComponent from '../../components/features/events/EventFilters';

const Events = () => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`🚀 Events: Component render #${renderCount.current} started`);
  const componentStartTime = useRef(performance.now());
  
  const { user } = useAuth();
  console.log('⚡ Events: Auth hook completed in', Math.round(performance.now() - componentStartTime.current), 'ms');
  
  const [filters, setFilters] = useState<EventFiltersType>({});

  // Use our new RTK Query hook with client-side filtering
  const dataFetchStartTime = useRef(performance.now());
  const hookResult = useEventsWithFiltering(filters);
  console.log('📊 Events: Data fetching hook completed in', Math.round(performance.now() - dataFetchStartTime.current), 'ms');
  
  const filteredEvents = hookResult.events;
  const filterOptions = hookResult.filterOptions;
  const isLoading = hookResult.isLoading;
  const isRefetching = hookResult.isRefetching;
  const error = hookResult.error;
  const hasFilteredResults = hookResult.hasFilteredResults;
  const allEventsCount = hookResult.allEventsCount;

  // Track loading state changes
  const prevLoadingRef = useRef(isLoading);
  const prevDataRef = useRef({ eventsCount: 0, filterOptionsCount: 0 });
  
  useEffect(() => {
    const currentData = {
      eventsCount: filteredEvents.length,
      filterOptionsCount: Object.keys(filterOptions).length
    };
    
    if (prevLoadingRef.current && !isLoading) {
      const totalTime = performance.now() - componentStartTime.current;
      console.log('✅ Events: Loading completed! Total time:', Math.round(totalTime), 'ms');
      console.log('📈 Events: Final data:', {
        ...currentData,
        hasError: !!error
      });
    }
    
    // Only log data changes when they actually change
    if (currentData.eventsCount !== prevDataRef.current.eventsCount || 
        currentData.filterOptionsCount !== prevDataRef.current.filterOptionsCount) {
      console.log('📊 Events: Data changed:', {
        from: prevDataRef.current,
        to: currentData
      });
      prevDataRef.current = currentData;
    }
    
    prevLoadingRef.current = isLoading;
  }, [isLoading, filteredEvents.length, filterOptions, error]);

  const handleFilterChange = useCallback((newFilters: Partial<EventFiltersType>) => {
    const filterStartTime = performance.now();
    console.log('🔍 Events: Filter change started:', newFilters);
    setFilters(prev => {
      const newFilterState = { ...prev, ...newFilters };
      console.log('⚡ Events: Filter state updated in', Math.round(performance.now() - filterStartTime), 'ms');
      return newFilterState;
    });
  }, []);

  // Show loading if not authenticated
  if (!user) {
    console.log('❌ Events: No user, showing login prompt');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Please log in to view events</p>
        </div>
      </div>
    );
  }

  console.log(`🎨 Events: Render #${renderCount.current} with data:`, {
    isLoading,
    eventsCount: filteredEvents.length,
    hasError: !!error,
    renderTime: Math.round(performance.now() - componentStartTime.current),
    user: !!user,
    hasFilteredResults
  });

  return (
    <div className="h-screen bg-[#F6F6F3] flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-hidden flex flex-col">
        <div className="rounded-3xl bg-white shadow-soft p-4 lg:p-8 max-w-full flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 lg:mb-8">
            <div className="min-w-0">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 break-words">Events</h2>
              <p className="text-gray-600 break-words">
                Track and analyze your event performance
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
          <div className="mb-4 flex-shrink-0">
            <EventFiltersComponent
              filters={filters}
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Events List - takes remaining space */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {(() => {
              if (isLoading) {
                console.log('⏳ Events: Showing loading state');
                return (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading events...</p>
                    </div>
                  </div>
                );
              } else if (!hasFilteredResults) {
                console.log('📭 Events: Showing empty state');
                return (
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
                );
              } else {
                const tableRenderStart = performance.now();
                console.log('📊 Events: Rendering EventTable with', filteredEvents.length, 'events');
                const table = <EventTable events={filteredEvents} />;
                console.log('⚡ Events: EventTable rendered in', Math.round(performance.now() - tableRenderStart), 'ms');
                return table;
              }
            })()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Events;
