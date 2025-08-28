import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { ArtistService } from '../../services/artistService';
import { VibrateService } from '../../services/vibrateService';
import type { Tables } from '../../database.types';
import type { 
  VibrateArtist,
  VibrateArtistLink, 
  VibrateEvent, 
  VibrateAudienceData, 
  VibrateBioData, 
  VibrateSpotifyListenersData, 
  VibrateInstagramAudienceData, 
  VibrateTikTokAudienceData, 
  VibrateYouTubeAudienceData, 
  VibrateSoundCloudFanbaseData, 
  VibrateSoundCloudPlaysData, 
  VibrateSpotifyFanbaseData, 
  VibrateEnhancedSpotifyListenersData, 
  VibrateYouTubeViewsData, 
  VibrateYouTubeFanbaseData,
  VibrateInstagramFanbaseData,
  VibrateFacebookFanbaseData,
  VibrateTikTokFanbaseData
} from '../../services/vibrateService';

// Artist with events type
export type ArtistWithEvents = Tables<'artists'> & {
  events: Array<Tables<'events'> & {
    venues: Tables<'venues'>;
    is_headliner: boolean;
    performance_order: number;
  }>;
};

// Combined artist data type for caching
export type ArtistDetailsData = {
  localArtist: ArtistWithEvents | null;
  vibrateArtist: VibrateArtist | null;
  links: VibrateArtistLink[];
  upcomingEvents: VibrateEvent[];
  pastEvents: VibrateEvent[];
  audience: VibrateAudienceData;
  bio: VibrateBioData;
  spotifyListeners: VibrateSpotifyListenersData;
  instagramAudience: VibrateInstagramAudienceData;
  tiktokAudience: VibrateTikTokAudienceData;
  youtubeAudience: VibrateYouTubeAudienceData;
  soundcloudFanbase: VibrateSoundCloudFanbaseData;
  soundcloudPlays: VibrateSoundCloudPlaysData;
  spotifyFanbase: VibrateSpotifyFanbaseData;
  enhancedSpotifyListeners: VibrateEnhancedSpotifyListenersData;
  youtubeViews: VibrateYouTubeViewsData;
  youtubeFanbase: VibrateYouTubeFanbaseData;
  instagramFanbase: VibrateInstagramFanbaseData;
  facebookFanbase: VibrateFacebookFanbaseData;
  tiktokFanbase: VibrateTikTokFanbaseData;
};

// Define our artists API
export const artistsApi = createApi({
  reducerPath: 'artistsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Artist', 'ArtistDetails', 'VibrateData'],
  endpoints: (builder) => ({
    // Get artist with events from our database
    getArtistWithEvents: builder.query<ArtistWithEvents | null, string>({
      queryFn: async (artistId) => {
        try {
          console.log('RTK Query: Fetching local artist with events:', artistId);
          const artist = await ArtistService.getArtistWithEvents(artistId);
          console.log('RTK Query: Cached local artist data');
          return { data: artist };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (_result, _error, artistId) => [
        { type: 'Artist', id: artistId }
      ],
      keepUnusedDataFor: 10 * 60, // 10 minutes
    }),

    // Get comprehensive artist details (local + Vibrate data)
    getArtistDetails: builder.query<ArtistDetailsData, string>({
      queryFn: async (artistId) => {
        try {
          console.log('RTK Query: Starting comprehensive artist data fetch for:', artistId);
          const fetchStart = performance.now();

          // Resolve the Viberate UUID (handles both local IDs and Vibrate UUIDs)
          const vibrateUuid = await ArtistService.getOrResolveVibrateUuid(artistId);
          console.log('RTK Query: UUID resolution completed in', Math.round(performance.now() - fetchStart), 'ms');

          if (!vibrateUuid) {
            console.log('RTK Query: No Vibrate UUID found, fetching local data only');
            const localArtist = await ArtistService.getArtistWithEvents(artistId);
            return {
              data: {
                localArtist,
                vibrateArtist: null,
                links: [],
                upcomingEvents: [],
                pastEvents: [],
                audience: {},
                bio: { BIO: [], FAQ: [] },
                spotifyListeners: { byCity: [], byCountry: {} },
                instagramAudience: { byCity: [], byCountry: [], byGender: {} as any, byAge: {} },
                tiktokAudience: { byCountry: [], byGender: {} as any, byAge: {} },
                youtubeAudience: { byCountry: {}, byGender: {} as any, byAge: {} },
                soundcloudFanbase: { total: {} },
                soundcloudPlays: { plays: {} },
                spotifyFanbase: { total: {} },
                enhancedSpotifyListeners: { total: {} },
                youtubeViews: { views: {} },
                youtubeFanbase: { total: {} },
                instagramFanbase: { total: {} },
                facebookFanbase: { facebookFanbase: { uuid: '', name: '', slug: '', data: {} } },
                tiktokFanbase: { tiktokFanbase: { uuid: '', name: '', slug: '', data: {} } },
              }
            };
          }

          // Get local artist data in parallel with Vibrate data
          // Note: If artistId is a direct Vibrate UUID, this might return null (no local artist)
          const localArtistPromise = ArtistService.getArtistWithEvents(artistId);

          // Then get all Vibrate data in parallel using the resolved UUID
          console.log('RTK Query: Starting parallel Vibrate API calls with UUID:', vibrateUuid);
          const vibrateStart = performance.now();

          const [
            localArtist,
            linksResponse,
            eventsResponse,
            audienceResponse,
            bioResponse,
            spotifyListenersResponse,
            instagramAudienceResponse,
            tiktokAudienceResponse,
            youtubeAudienceResponse,
            soundcloudFanbaseResponse,
            soundcloudPlaysResponse,
            spotifyFanbaseResponse,
            enhancedSpotifyListenersResponse,
            youtubeViewsResponse,
            youtubeFanbaseResponse,
            instagramFanbaseResponse,
            facebookFanbaseResponse,
            tiktokFanbaseResponse
          ] = await Promise.all([
            localArtistPromise,
            VibrateService.getArtistLinks(vibrateUuid),
            VibrateService.getArtistEvents(vibrateUuid),
            VibrateService.getArtistAudience(vibrateUuid),
            VibrateService.getArtistBio(vibrateUuid),
            VibrateService.getArtistSpotifyListeners(vibrateUuid),
            VibrateService.getArtistInstagramAudience(vibrateUuid),
            VibrateService.getArtistTikTokAudience(vibrateUuid),
            VibrateService.getArtistYouTubeAudience(vibrateUuid),
            VibrateService.getArtistSoundCloudFanbase(vibrateUuid),
            VibrateService.getArtistSoundCloudPlays(vibrateUuid),
            VibrateService.getArtistSpotifyFanbase(vibrateUuid),
            VibrateService.getArtistEnhancedSpotifyListeners(vibrateUuid),
            VibrateService.getArtistYouTubeViews(vibrateUuid),
            VibrateService.getArtistYouTubeFanbase(vibrateUuid),
            VibrateService.getArtistInstagramFanbase(vibrateUuid),
            VibrateService.getArtistFacebookFanbase(vibrateUuid),
            VibrateService.getArtistTikTokFanbase(vibrateUuid)
          ]);

          console.log('RTK Query: Parallel Vibrate API calls completed in', Math.round(performance.now() - vibrateStart), 'ms');

          // Process events
          const upcomingEvents = eventsResponse?.upcoming || [];
          const pastEvents = eventsResponse?.past || [];

          // Get full artist data (with image, verified, genre, country, subgenres) if we have a name
          let fullVibrateArtist: VibrateArtist | null = null;
          const basicVibrateArtist = linksResponse?.artist;
          if (basicVibrateArtist?.name) {
            try {
              console.log('RTK Query: Fetching full artist data via search for:', basicVibrateArtist.name);
              const searchResponse = await VibrateService.searchArtists(basicVibrateArtist.name);
              if (searchResponse?.artists?.length) {
                // Find the artist with matching UUID, or fallback to first result
                fullVibrateArtist = searchResponse.artists.find(a => a.uuid === basicVibrateArtist.uuid) || searchResponse.artists[0];
                console.log('RTK Query: Found full artist data with image and metadata');
              }
            } catch (searchError) {
              console.warn('RTK Query: Could not fetch full artist data:', searchError);
            }
          }

          const totalTime = Math.round(performance.now() - fetchStart);
          console.log('RTK Query: Complete artist details fetch completed in', totalTime, 'ms');

          return {
            data: {
              localArtist,
              vibrateArtist: fullVibrateArtist,
              links: linksResponse?.links || [],
              upcomingEvents,
              pastEvents,
              audience: audienceResponse?.audience || {},
              bio: bioResponse?.bio || { BIO: [], FAQ: [] },
              spotifyListeners: spotifyListenersResponse?.listeners || { byCity: [], byCountry: {} },
              instagramAudience: instagramAudienceResponse?.audience || { byCity: [], byCountry: [], byGender: {} as any, byAge: {} },
              tiktokAudience: tiktokAudienceResponse?.audience || { byCountry: [], byGender: {} as any, byAge: {} },
              youtubeAudience: youtubeAudienceResponse?.audience || { byCountry: {}, byGender: {} as any, byAge: {} },
              soundcloudFanbase: soundcloudFanbaseResponse ? { total: soundcloudFanbaseResponse.total } : { total: {} },
              soundcloudPlays: soundcloudPlaysResponse ? { plays: soundcloudPlaysResponse.plays } : { plays: {} },
              spotifyFanbase: spotifyFanbaseResponse ? { total: spotifyFanbaseResponse.total } : { total: {} },
              enhancedSpotifyListeners: enhancedSpotifyListenersResponse ? { total: enhancedSpotifyListenersResponse.total } : { total: {} },
              youtubeViews: youtubeViewsResponse ? { views: youtubeViewsResponse.views } : { views: {} },
              youtubeFanbase: youtubeFanbaseResponse ? { total: youtubeFanbaseResponse.total } : { total: {} },
              instagramFanbase: instagramFanbaseResponse ? { total: instagramFanbaseResponse.total } : { total: {} },
              facebookFanbase: facebookFanbaseResponse || { facebookFanbase: { uuid: '', name: '', slug: '', data: {} } },
              tiktokFanbase: tiktokFanbaseResponse || { tiktokFanbase: { uuid: '', name: '', slug: '', data: {} } },
            }
          };
        } catch (error: any) {
          console.error('RTK Query: Artist details fetch error:', error);
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: (_result, _error, artistId) => [
        { type: 'ArtistDetails', id: artistId },
        { type: 'VibrateData', id: artistId }
      ],
      keepUnusedDataFor: 15 * 60, // 15 minutes - longer cache for expensive external API calls
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetArtistWithEventsQuery,
  useGetArtistDetailsQuery,
  useLazyGetArtistWithEventsQuery,
  useLazyGetArtistDetailsQuery,
} = artistsApi;
