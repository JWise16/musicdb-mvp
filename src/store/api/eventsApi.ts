import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { EventService, type EventFilters, type EventWithDetails } from '../../services/eventService';

// Define our events API
export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Event', 'FilterOptions'],
  endpoints: (builder) => ({
    // Get all events with filters
    getEvents: builder.query<EventWithDetails[], EventFilters>({
      queryFn: async (filters) => {
        try {
          console.log('RTK Query: Fetching events with filters:', filters);
          const events = await EventService.getEventsWithFiltersImproved(filters);
          console.log(`RTK Query: Cached ${events.length} events`);
          return { data: events };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Event'],
      // Cache for 5 minutes
      keepUnusedDataFor: 5 * 60, // 5 minutes
    }),
    
    // Get filter options (genres, cities, etc.)
    getFilterOptions: builder.query<{
      genres: string[];
      cities: string[];
      venueSizes: Array<{ value: string; label: string; count: number }>;
      venueHistogram: number[];
    }, void>({
      queryFn: async () => {
        try {
          console.log('RTK Query: Fetching filter options');
          const options = await EventService.getFilterOptions();
          console.log('RTK Query: Cached filter options');
          return { data: options };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['FilterOptions'],
      // Cache filter options for 10 minutes (they change rarely)
      keepUnusedDataFor: 10 * 60, // 10 minutes
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetEventsQuery,
  useGetFilterOptionsQuery,
  useLazyGetEventsQuery,
} = eventsApi;
