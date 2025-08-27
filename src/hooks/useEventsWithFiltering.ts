import { useMemo } from 'react';
import { useGetEventsQuery, useGetFilterOptionsQuery } from '../store/api/eventsApi';
import { filterEventsLocally } from '../store/utils/clientFiltering';
import type { EventFilters, EventWithDetails } from '../services/eventService';

/**
 * Custom hook that combines RTK Query caching with client-side filtering
 * This provides the best performance by:
 * 1. Caching all events data with RTK Query
 * 2. Filtering locally to avoid repeated API calls
 * 3. Providing real-time filter updates
 */
export const useEventsWithFiltering = (filters: EventFilters = {}): {
  events: EventWithDetails[];
  allEventsCount: number;
  filteredCount: number;
  filterOptions: {
    genres: string[];
    cities: string[];
    venueSizes: Array<{ value: string; label: string; count: number }>;
    venueHistogram: number[];
  };
  isLoading: boolean;
  isRefetching: boolean;
  error: any;
  hasData: boolean;
  hasFilteredResults: boolean;
  isFiltered: boolean;
} => {
  // Always fetch with 'past' timeframe to match current behavior
  // We'll apply other filters client-side
  const baseFilters = { timeFrame: 'past' as const };
  
  // Fetch all events (cached by RTK Query)
  const {
    data: allEvents = [],
    isLoading: eventsLoading,
    error: eventsError,
    isFetching: eventsRefetching,
  } = useGetEventsQuery(baseFilters);

  // Fetch filter options (cached separately)
  const {
    data: filterOptions,
    isLoading: filterOptionsLoading,
    error: filterOptionsError,
  } = useGetFilterOptionsQuery();

  // Apply client-side filtering to cached events
  const filteredEvents = useMemo(() => {
    if (!allEvents.length) return [];
    
    console.log(`Client filtering: ${allEvents.length} events with filters:`, filters);
    const filtered = filterEventsLocally(allEvents, filters);
    console.log(`Client filtering result: ${filtered.length} events match filters`);
    
    return filtered;
  }, [allEvents, filters]);

  return {
    // Event data
    events: filteredEvents,
    allEventsCount: allEvents.length as number,
    filteredCount: filteredEvents.length as number,
    
    // Filter options
    filterOptions: filterOptions || {
      genres: [],
      cities: [],
      venueSizes: [],
      venueHistogram: [],
    },
    
    // Loading states
    isLoading: Boolean(eventsLoading || filterOptionsLoading),
    isRefetching: Boolean(eventsRefetching),
    
    // Error states
    error: eventsError || filterOptionsError,
    
    // Helper flags
    hasData: allEvents.length > 0,
    hasFilteredResults: filteredEvents.length > 0,
    isFiltered: Object.keys(filters).some(key => 
      filters[key as keyof EventFilters] !== undefined && 
      filters[key as keyof EventFilters] !== ''
    ),
  };
};
