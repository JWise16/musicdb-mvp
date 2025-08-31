import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { EventService, type EventFilters, type EventWithDetails, type EventFormData } from '../../services/eventService';

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

    // MUTATIONS - Create, Update, Delete operations
    
    // Create a new event
    createEvent: builder.mutation<
      { success: boolean; eventId?: string; error?: string },
      EventFormData
    >({
      queryFn: async (eventData) => {
        try {
          console.log('RTK Mutation: Creating event:', eventData);
          const result = await EventService.createEvent(eventData);
          console.log('RTK Mutation: Event creation result:', result);
          return { data: result };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (result, error, arg) => [
        'Event', 
        'FilterOptions',
        // Invalidate venue events for the venue this event was created for
        { type: 'VenueEvents', id: arg.venue_id },
        // Invalidate venue analytics since new events affect analytics
        { type: 'VenueAnalytics', id: `${arg.venue_id}-YTD` },
        { type: 'VenueAnalytics', id: `${arg.venue_id}-MTD` },
        { type: 'VenueAnalytics', id: `${arg.venue_id}-ALL` }
      ],
    }),

    // Update an event
    updateEvent: builder.mutation<
      { success: boolean; error?: string },
      { eventId: string; updates: Partial<EventFormData> }
    >({
      queryFn: async ({ eventId, updates }) => {
        try {
          console.log('RTK Mutation: Updating event:', eventId, updates);
          // Note: EventService doesn't have updateEvent method, we'll implement it
          const { supabase } = await import('../../supabaseClient');
          const { error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', eventId);

          if (error) {
            throw error;
          }

          console.log('RTK Mutation: Event update successful');
          return { data: { success: true } };
        } catch (error: any) {
          console.error('RTK Mutation: Event update error:', error);
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (result, error, { eventId }) => [
        'Event',
        'FilterOptions',
        { type: 'Event', id: eventId },
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  // Queries
  useGetEventsQuery,
  useGetFilterOptionsQuery,
  useLazyGetEventsQuery,
  
  // Mutations
  useCreateEventMutation,
  useUpdateEventMutation,
} = eventsApi;
