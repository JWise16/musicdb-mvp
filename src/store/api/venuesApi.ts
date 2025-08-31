import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { VenueService, type VenueData, type UserVenueData } from '../../services/venueService';
import type { Tables } from '../../database.types';

// User venue relationship type
export type UserVenueRelation = {
  role: string;
  venue: Tables<'venues'>;
};

// Define our venues API
export const venuesApi = createApi({
  reducerPath: 'venuesApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Venue', 'UserVenues', 'AllVenues', 'VenueAnalytics', 'VenueEvents'],
  endpoints: (builder) => ({
    // Get all venues (for venue selection, admin purposes)
    getAllVenues: builder.query<Tables<'venues'>[], void>({
      queryFn: async () => {
        try {
          console.log('RTK Query: Fetching all venues');
          const venues = await VenueService.getAllVenues();
          console.log(`RTK Query: Cached ${venues.length} venues`);
          return { data: venues };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['AllVenues'],
      // Cache venues for 10 minutes (they change rarely)
      keepUnusedDataFor: 10 * 60, // 10 minutes
    }),

    // Get venues associated with a specific user
    getUserVenues: builder.query<Tables<'venues'>[], string>({
      queryFn: async (userId) => {
        try {
          console.log('RTK Query: Fetching user venues for:', userId);
          const venues = await VenueService.getUserVenues(userId);
          console.log(`RTK Query: Cached ${venues.length} user venues`);
          return { data: venues };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (_result, _error, userId) => [
        { type: 'UserVenues', id: userId },
        'UserVenues'
      ],
      // Cache user venues for 5 minutes
      keepUnusedDataFor: 5 * 60, // 5 minutes
    }),

    // Get user venue relationship (for Sidebar display)
    getUserVenueRelation: builder.query<UserVenueRelation | null, string>({
      queryFn: async (userId) => {
        try {
          console.log('RTK Query: Fetching user venue relation for:', userId);
          // This is the query that Sidebar currently makes
          const { supabase } = await import('../../supabaseClient');
          const { data, error } = await supabase
            .from('user_venues')
            .select(`
              role,
              venue:venues (
                name
              )
            `)
            .eq('user_id', userId)
            .single();

          if (error) {
            console.log('RTK Query: No venue relation found for user');
            return { data: null };
          }

          // Handle the nested venue data structure
          const venueData = {
            role: data.role,
            venue: Array.isArray(data.venue) ? data.venue[0] : data.venue
          } as UserVenueRelation;

          console.log('RTK Query: Cached user venue relation');
          return { data: venueData };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (_result, _error, userId) => [
        { type: 'UserVenues', id: `${userId}-relation` }
      ],
      // Cache venue relation for 10 minutes (rarely changes)
      keepUnusedDataFor: 10 * 60, // 10 minutes
    }),

    // Check if user has venues (for onboarding logic)
    checkUserHasVenues: builder.query<boolean, string>({
      queryFn: async (userId) => {
        try {
          console.log('RTK Query: Checking if user has venues:', userId);
          const hasVenues = await VenueService.hasUserVenues(userId);
          console.log('RTK Query: User has venues result:', hasVenues);
          return { data: hasVenues };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (_result, _error, userId) => [
        { type: 'UserVenues', id: `${userId}-check` }
      ],
      // Cache for 5 minutes
      keepUnusedDataFor: 5 * 60, // 5 minutes
    }),

    // Get venue by ID (for venue details pages)
    getVenueById: builder.query<Tables<'venues'> | null, string>({
      queryFn: async (venueId) => {
        try {
          console.log('RTK Query: Fetching venue by ID:', venueId);
          const venue = await VenueService.getVenueById(venueId);
          console.log('RTK Query: Cached venue details');
          return { data: venue };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (_result, _error, venueId) => [
        { type: 'Venue', id: venueId }
      ],
      // Cache venue details for 15 minutes
      keepUnusedDataFor: 15 * 60, // 15 minutes
    }),

    // Get venue analytics (for Dashboard)
    getVenueAnalytics: builder.query<any, { venueId: string; timeFrame: 'YTD' | 'MTD' | 'ALL' }>({
      queryFn: async ({ venueId, timeFrame }) => {
        try {
          console.log(`RTK Query: Fetching venue analytics for ${venueId} (${timeFrame})`);
          const { VenueService } = await import('../../services/venueService');
          const analytics = await VenueService.getVenueAnalytics(venueId, timeFrame);
          console.log('RTK Query: Cached venue analytics');
          return { data: analytics };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (_result, _error, { venueId, timeFrame }) => [
        { type: 'VenueAnalytics', id: `${venueId}-${timeFrame}` }
      ],
      // Cache analytics for 2 minutes (they change more frequently)
      keepUnusedDataFor: 2 * 60, // 2 minutes
    }),

    // Get venue events (for Dashboard)
    getVenueEvents: builder.query<any, string>({
      queryFn: async (venueId) => {
        try {
          console.log(`RTK Query: Fetching venue events for ${venueId}`);
          const { VenueService } = await import('../../services/venueService');
          const events = await VenueService.getVenueEvents(venueId);
          console.log('RTK Query: Cached venue events');
          return { data: events };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (_result, _error, venueId) => [
        { type: 'VenueEvents', id: venueId }
      ],
      // Cache events for 3 minutes (they change moderately)
      keepUnusedDataFor: 3 * 60, // 3 minutes
    }),

    // MUTATIONS - Create, Update, Delete operations
    
    // Create a new venue
    createVenue: builder.mutation<
      { success: boolean; venueId?: string; error?: string },
      VenueData
    >({
      queryFn: async (venueData) => {
        try {
          console.log('RTK Mutation: Creating venue:', venueData);
          const result = await VenueService.createVenue(venueData);
          console.log('RTK Mutation: Venue creation result:', result);
          return { data: result };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['AllVenues', 'UserVenues'],
    }),

    // Create venue with image
    createVenueWithImage: builder.mutation<
      { success: boolean; venueId?: string; error?: string },
      { venueData: VenueData; imageFile?: File }
    >({
      queryFn: async ({ venueData, imageFile }) => {
        try {
          console.log('RTK Mutation: Creating venue with image:', venueData);
          const result = await VenueService.createVenueWithImage(venueData, imageFile);
          console.log('RTK Mutation: Venue with image creation result:', result);
          return { data: result };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['AllVenues', 'UserVenues'],
    }),

    // Associate user with venue
    associateUserWithVenue: builder.mutation<
      { success: boolean; error?: string },
      UserVenueData
    >({
      queryFn: async (userVenueData) => {
        try {
          console.log('RTK Mutation: Associating user with venue:', userVenueData);
          const result = await VenueService.associateUserWithVenue(userVenueData);
          console.log('RTK Mutation: User venue association result:', result);
          return { data: result };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (result, error, { user_id }) => [
        'UserVenues',
        { type: 'UserVenues', id: user_id },
        { type: 'UserVenues', id: `${user_id}-relation` },
        { type: 'UserVenues', id: `${user_id}-check` },
      ],
    }),

    // Update venue
    updateVenue: builder.mutation<
      { success: boolean; error?: string },
      { venueId: string; updates: Partial<VenueData> }
    >({
      queryFn: async ({ venueId, updates }) => {
        try {
          console.log('RTK Mutation: Updating venue:', venueId, updates);
          // Note: VenueService doesn't have updateVenue method, we'll implement it
          const { supabase } = await import('../../supabaseClient');
          const { error } = await supabase
            .from('venues')
            .update(updates)
            .eq('id', venueId);

          if (error) {
            throw error;
          }

          console.log('RTK Mutation: Venue update successful');
          return { data: { success: true } };
        } catch (error: any) {
          console.error('RTK Mutation: Venue update error:', error);
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (result, error, { venueId }) => [
        'AllVenues',
        'UserVenues', 
        { type: 'Venue', id: venueId },
        'VenueAnalytics',
        'VenueEvents',
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  // Queries
  useGetAllVenuesQuery,
  useGetUserVenuesQuery,
  useGetUserVenueRelationQuery,
  useCheckUserHasVenuesQuery,
  useGetVenueByIdQuery,
  useGetVenueAnalyticsQuery,
  useGetVenueEventsQuery,
  useLazyGetAllVenuesQuery,
  useLazyGetUserVenuesQuery,
  
  // Mutations
  useCreateVenueMutation,
  useCreateVenueWithImageMutation,
  useAssociateUserWithVenueMutation,
  useUpdateVenueMutation,
} = venuesApi;
