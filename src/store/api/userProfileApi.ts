import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { UserProfileService } from '../../services/userProfileService';
import type { Database } from '../../database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

// Define our user profile API
export const userProfileApi = createApi({
  reducerPath: 'userProfileApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['UserProfile'],
  endpoints: (builder) => ({
    // Get user profile
    getUserProfile: builder.query<UserProfile | null, string>({
      queryFn: async (userId) => {
        try {
          console.log('RTK Query: Fetching user profile for:', userId);
          const result = await UserProfileService.getUserProfile(userId);
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          console.log('RTK Query: Cached user profile');
          return { data: result.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (result, error, userId) => [
        { type: 'UserProfile', id: userId },
        'UserProfile'
      ],
      // Cache profile for 10 minutes
      keepUnusedDataFor: 10 * 60, // 10 minutes
    }),

    // MUTATIONS - Update operations
    
    // Update user profile
    updateUserProfile: builder.mutation<
      UserProfile | null,
      { userId: string; updates: UserProfileUpdate }
    >({
      queryFn: async ({ userId, updates }) => {
        try {
          console.log('RTK Mutation: Updating user profile:', userId, updates);
          const result = await UserProfileService.updateUserProfile(userId, updates);
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          console.log('RTK Mutation: Profile update successful');
          return { data: result.data };
        } catch (error: any) {
          console.error('RTK Mutation: Profile update error:', error);
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: 'UserProfile', id: userId },
        'UserProfile'
      ],
    }),

    // Update user profile with avatar
    updateUserProfileWithAvatar: builder.mutation<
      UserProfile | null,
      { userId: string; updates: UserProfileUpdate; avatarFile?: File }
    >({
      queryFn: async ({ userId, updates, avatarFile }) => {
        try {
          console.log('RTK Mutation: Updating user profile with avatar:', userId, updates);
          const result = await UserProfileService.updateProfileWithAvatar(userId, updates, avatarFile);
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          console.log('RTK Mutation: Profile with avatar update successful');
          return { data: result.data };
        } catch (error: any) {
          console.error('RTK Mutation: Profile with avatar update error:', error);
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: 'UserProfile', id: userId },
        'UserProfile'
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  // Queries
  useGetUserProfileQuery,
  useLazyGetUserProfileQuery,
  
  // Mutations
  useUpdateUserProfileMutation,
  useUpdateUserProfileWithAvatarMutation,
} = userProfileApi;
