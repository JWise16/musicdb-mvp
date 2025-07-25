import { supabase } from '../supabaseClient';

export type VibrateArtist = {
  uuid: string;
  name: string;
  slug: string;
  image: string;
  rank: number;
  verified: boolean;
  country: {
    name: string;
    alpha2: string;
    continent_code: string;
  };
  genre: {
    id: number;
    name: string;
    slug: string;
  };
  subgenres: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
};

export type VibrateSearchResponse = {
  success: boolean;
  artists: VibrateArtist[];
  pagination: {
    total: number;
    current: number;
    limit: number;
    offset: number;
  };
};

export type VibrateArtistLink = {
  channel_id: number;
  channel: string;
  link: string;
  link_id: string;
};

export type VibrateLinksResponse = {
  success: boolean;
  artist: {
    uuid: string;
    name: string;
    slug: string;
  };
  links: VibrateArtistLink[];
};

export type VibrateEvent = {
  type: 'event' | 'festival';
  uuid: string;
  name: string;
  slug: string;
  image: string | null;
  start: string; // ISO date string
  end: string | null;
  genres: Array<{
    id: number;
    name: string;
    slug: string;
  }> | null;
  subgenres: Array<{
    id: number;
    name: string;
    slug: string;
  }> | null;
  venue?: {
    uuid: string;
    name: string;
    slug: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    city: {
      name: string;
      slug: string;
      country_alpha2: string;
      region: string;
      major: boolean;
    };
    country: {
      alpha2: string;
      name: string;
      slug: string;
      continent_code: string;
    };
  };
  // For festivals, city/country are at the top level
  city?: {
    name: string;
    slug: string;
    country_alpha2: string;
    region: string;
    major: boolean;
  };
  country?: {
    alpha2: string;
    name: string;
    slug: string;
    continent_code: string;
  };
};

export type VibrateEventsResponse = {
  success: boolean;
  artist: {
    uuid: string;
    name: string;
    slug: string;
  };
  upcoming: VibrateEvent[];
  past: VibrateEvent[];
};

export type VibrateAudienceData = {
  [key: string]: any; // Generic type since we don't know the exact structure yet
};

export type VibrateAudienceResponse = {
  success: boolean;
  artist: {
    uuid: string;
    name: string;
    slug: string;
  };
  audience: VibrateAudienceData;
};

export type VibrateBioItem = {
  question: string;
  answer: string;
};

export type VibrateBioData = {
  BIO: VibrateBioItem[];
  FAQ: VibrateBioItem[];
};

export type VibrateBioResponse = {
  success: boolean;
  artist: {
    uuid: string;
    name: string;
    slug: string;
  };
  bio: VibrateBioData;
};

export type VibrateSpotifyListenerCity = {
  city: string;
  city_id: string;
  coordinates: {
    lat: string;
    lng: string;
  };
  country_code: string;
  listeners_1m: number;
};

export type VibrateSpotifyListenersData = {
  byCity: VibrateSpotifyListenerCity[];
  byCountry: { [countryCode: string]: number };
};

export type VibrateSpotifyListenersResponse = {
  success: boolean;
  artist: {
    uuid: string;
    name: string;
    slug: string;
  };
  listeners: VibrateSpotifyListenersData;
};

export type VibrateInstagramAudienceCity = {
  city: string;
  city_id: string;
  coordinates: {
    lat: string;
    lng: string;
  };
  country_code: string;
  instagram_followers: number;
  instagram_followers_pct: number;
};

export type VibrateInstagramAudienceCountry = {
  country_code: string;
  instagram_followers: number | null;
  instagram_followers_pct: number;
};

export type VibrateInstagramGenderData = {
  male: {
    pct: number;
    total: number;
  };
  female: {
    pct: number;
    total: number;
  };
};

export type VibrateInstagramAgeGroup = {
  male: {
    pct: number;
    total: number;
  };
  female: {
    pct: number;
    total: number;
  };
};

export type VibrateInstagramAgeData = {
  [ageGroup: string]: VibrateInstagramAgeGroup;
};

export type VibrateInstagramAudienceData = {
  byCity: VibrateInstagramAudienceCity[];
  byCountry: VibrateInstagramAudienceCountry[];
  byGender: VibrateInstagramGenderData;
  byAge: VibrateInstagramAgeData;
};

export type VibrateInstagramAudienceResponse = {
  success: boolean;
  artist: {
    uuid: string;
    name: string;
    slug: string;
  };
  audience: VibrateInstagramAudienceData;
};

export type VibrateTikTokAudienceCountry = {
  country_code: string;
  tiktok_followers: number | null;
  tiktok_followers_pct: number;
};

export type VibrateTikTokGenderData = {
  male: {
    pct: number;
    total: number;
  };
  female: {
    pct: number;
    total: number;
  };
};

export type VibrateTikTokAgeGroup = {
  male: {
    pct: number;
    total: number;
  };
  female: {
    pct: number;
    total: number;
  };
};

export type VibrateTikTokAgeData = {
  [ageGroup: string]: VibrateTikTokAgeGroup;
};

export type VibrateTikTokAudienceData = {
  byCountry: VibrateTikTokAudienceCountry[];
  byGender: VibrateTikTokGenderData;
  byAge: VibrateTikTokAgeData;
};

export type VibrateTikTokAudienceResponse = {
  success: boolean;
  artist: {
    uuid: string;
    name: string;
    slug: string;
  };
  audience: VibrateTikTokAudienceData;
};

export type VibrateYouTubeCountryData = {
  [countryCode: string]: {
    alltime: number;
  };
};

export type VibrateYouTubeGenderData = {
  male: {
    pct: number;
    total: number;
  };
  female: {
    pct: number;
    total: number;
  };
};

export type VibrateYouTubeAgeGroup = {
  male: {
    pct: number;
    total: number;
  };
  female: {
    pct: number;
    total: number;
  };
};

export type VibrateYouTubeAgeData = {
  [ageGroup: string]: VibrateYouTubeAgeGroup;
};

export type VibrateYouTubeAudienceData = {
  byCountry: VibrateYouTubeCountryData;
  byGender: VibrateYouTubeGenderData;
  byAge: VibrateYouTubeAgeData;
};

export type VibrateYouTubeAudienceResponse = {
  success: boolean;
  artist: {
    uuid: string;
    name: string;
    slug: string;
  };
  audience: VibrateYouTubeAudienceData;
};

export class VibrateService {
  // Search for artists using the Viberate API via Supabase Edge Function
  static async searchArtists(artistName: string): Promise<VibrateSearchResponse | null> {
    try {
      console.log(`Searching Viberate for artist: ${artistName}`);
      
      const { data, error } = await supabase.functions.invoke('viberate-artist-search', {
        body: { artistName }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        return null;
      }

      if (!data?.success) {
        console.error('Edge function returned error:', data);
        return null;
      }

      console.log(`Viberate search found ${data.artists?.length || 0} artists`);
      return data;
    } catch (error) {
      console.error('Error in VibrateService.searchArtists:', error);
      return null;
    }
  }

  // Get the best match for an artist (first result that matches closely)
  static async getBestArtistMatch(artistName: string): Promise<VibrateArtist | null> {
    try {
      const searchResults = await this.searchArtists(artistName);
      
      if (!searchResults?.artists?.length) {
        return null;
      }

      // Return the first result (Viberate API returns results by relevance/rank)
      return searchResults.artists[0];
    } catch (error) {
      console.error('Error in VibrateService.getBestArtistMatch:', error);
      return null;
    }
  }

  // Find exact match by name (case insensitive)
  static async getExactArtistMatch(artistName: string): Promise<VibrateArtist | null> {
    try {
      const searchResults = await this.searchArtists(artistName);
      
      if (!searchResults?.artists?.length) {
        return null;
      }

      // Look for exact name match (case insensitive)
      const exactMatch = searchResults.artists.find(
        artist => artist.name.toLowerCase() === artistName.toLowerCase()
      );

      return exactMatch || searchResults.artists[0]; // Fallback to best match
    } catch (error) {
      console.error('Error in VibrateService.getExactArtistMatch:', error);
      return null;
    }
  }

  // Get artist links by UUID
  static async getArtistLinks(artistUuid: string): Promise<VibrateLinksResponse | null> {
    try {
      console.log(`Fetching links for artist UUID: ${artistUuid}`);
      
      const { data, error } = await supabase.functions.invoke('viberate-artist-links', {
        body: { artistUuid }
      });

      if (error) {
        console.error('Error calling artist links edge function:', error);
        return null;
      }

      if (!data?.success) {
        console.error('Artist links edge function returned error:', data);
        return null;
      }

      console.log(`Found ${data.links?.length || 0} links for artist`);
      return data;
    } catch (error) {
      console.error('Error in VibrateService.getArtistLinks:', error);
      return null;
    }
  }

  // Get artist events by UUID
  static async getArtistEvents(artistUuid: string): Promise<VibrateEventsResponse | null> {
    try {
      console.log(`Fetching events for artist UUID: ${artistUuid}`);
      
      const { data, error } = await supabase.functions.invoke('viberate-artist-events', {
        body: { artistUuid }
      });

      if (error) {
        console.error('Error calling artist events edge function:', error);
        return null;
      }

      if (!data?.success) {
        console.error('Artist events edge function returned error:', data);
        return null;
      }

      console.log(`Found ${(data.upcoming?.length || 0) + (data.past?.length || 0)} events for artist (${data.upcoming?.length || 0} upcoming, ${data.past?.length || 0} past)`);
      return data;
    } catch (error) {
      console.error('Error in VibrateService.getArtistEvents:', error);
      return null;
    }
  }

  // Get artist audience data by UUID
  static async getArtistAudience(artistUuid: string): Promise<VibrateAudienceResponse | null> {
    try {
      console.log(`Fetching audience data for artist UUID: ${artistUuid}`);
      
      const { data, error } = await supabase.functions.invoke('vibrate-artist-audience', {
        body: { artistUuid }
      });

      if (error) {
        console.error('Error calling artist audience edge function:', error);
        return null;
      }

      if (!data?.success) {
        console.error('Artist audience edge function returned error:', data);
        return null;
      }

      console.log(`Found audience data for artist`);
      return data;
    } catch (error) {
      console.error('Error in VibrateService.getArtistAudience:', error);
      return null;
    }
  }

  // Get artist bio data by UUID
  static async getArtistBio(artistUuid: string): Promise<VibrateBioResponse | null> {
    try {
      console.log(`Fetching bio data for artist UUID: ${artistUuid}`);
      
      const { data, error } = await supabase.functions.invoke('vibrate-artist-bio', {
        body: { artistUuid }
      });

      if (error) {
        console.error('Error calling artist bio edge function:', error);
        return null;
      }

      if (!data?.success) {
        console.error('Artist bio edge function returned error:', data);
        return null;
      }

      console.log(`Found bio data for artist`);
      return data;
    } catch (error) {
      console.error('Error in VibrateService.getArtistBio:', error);
      return null;
    }
  }

  // Get artist Spotify listeners by location data by UUID
  static async getArtistSpotifyListeners(artistUuid: string): Promise<VibrateSpotifyListenersResponse | null> {
    try {
      console.log(`Fetching Spotify listeners data for artist UUID: ${artistUuid}`);
      
      const { data, error } = await supabase.functions.invoke('vibrate-artist-spotify-listeners', {
        body: { artistUuid }
      });

      if (error) {
        console.error('Error calling artist Spotify listeners edge function:', error);
        return null;
      }

      if (!data?.success) {
        console.error('Artist Spotify listeners edge function returned error:', data);
        return null;
      }

      console.log(`Found Spotify listeners data for artist (${data.listeners?.byCity?.length || 0} cities)`);
      return data;
    } catch (error) {
      console.error('Error in VibrateService.getArtistSpotifyListeners:', error);
      return null;
    }
  }

  // Get artist Instagram audience data by UUID
  static async getArtistInstagramAudience(artistUuid: string): Promise<VibrateInstagramAudienceResponse | null> {
    try {
      console.log(`Fetching Instagram audience data for artist UUID: ${artistUuid}`);
      
      const { data, error } = await supabase.functions.invoke('vibrate-artist-instagram-audience', {
        body: { artistUuid }
      });

      if (error) {
        console.error('Error calling artist Instagram audience edge function:', error);
        return null;
      }

      if (!data?.success) {
        console.error('Artist Instagram audience edge function returned error:', data);
        return null;
      }

      console.log(`Found Instagram audience data for artist (${data.audience?.byCity?.length || 0} cities, ${data.audience?.byCountry?.length || 0} countries)`);
      return data;
    } catch (error) {
      console.error('Error in VibrateService.getArtistInstagramAudience:', error);
      return null;
    }
  }

  // Get artist TikTok audience data by UUID
  static async getArtistTikTokAudience(artistUuid: string): Promise<VibrateTikTokAudienceResponse | null> {
    try {
      console.log(`Fetching TikTok audience data for artist UUID: ${artistUuid}`);
      
      const { data, error } = await supabase.functions.invoke('vibrate-artist-tiktok-audience', {
        body: { artistUuid }
      });

      if (error) {
        console.error('Error calling artist TikTok audience edge function:', error);
        return null;
      }

      if (!data?.success) {
        console.error('Artist TikTok audience edge function returned error:', data);
        return null;
      }

      console.log(`Found TikTok audience data for artist (${data.audience?.byCountry?.length || 0} countries)`);
      return data;
    } catch (error) {
      console.error('Error in VibrateService.getArtistTikTokAudience:', error);
      return null;
    }
  }

  // Get artist YouTube audience data by UUID
  static async getArtistYouTubeAudience(artistUuid: string): Promise<VibrateYouTubeAudienceResponse | null> {
    try {
      console.log(`Fetching YouTube audience data for artist UUID: ${artistUuid}`);
      
      const { data, error } = await supabase.functions.invoke('vibrate-artist-youtube-audience', {
        body: { artistUuid }
      });

      if (error) {
        console.error('Error calling artist YouTube audience edge function:', error);
        return null;
      }

      if (!data?.success) {
        console.error('Artist YouTube audience edge function returned error:', data);
        return null;
      }

      console.log(`Found YouTube audience data for artist (${Object.keys(data.audience?.byCountry || {}).length} countries)`);
      return data;
    } catch (error) {
      console.error('Error in VibrateService.getArtistYouTubeAudience:', error);
      return null;
    }
  }

  // Get artist data with links (combines search + links calls)
  static async getArtistWithLinks(artistName: string): Promise<{
    artist: VibrateArtist | null;
    links: VibrateArtistLink[];
  }> {
    try {
      // First get the artist data
      const artist = await this.getExactArtistMatch(artistName);
      
      if (!artist?.uuid) {
        return { artist: null, links: [] };
      }

      // Then get their links
      const linksResponse = await this.getArtistLinks(artist.uuid);
      
      return {
        artist,
        links: linksResponse?.links || []
      };
    } catch (error) {
      console.error('Error in VibrateService.getArtistWithLinks:', error);
      return { artist: null, links: [] };
    }
  }

  // Get artist data with links and events (combines search + links + events calls)
  static async getArtistWithLinksAndEvents(artistName: string): Promise<{
    artist: VibrateArtist | null;
    links: VibrateArtistLink[];
    upcomingEvents: VibrateEvent[];
    pastEvents: VibrateEvent[];
  }> {
    try {
      // First get the artist data
      const artist = await this.getExactArtistMatch(artistName);
      
      if (!artist?.uuid) {
        return { artist: null, links: [], upcomingEvents: [], pastEvents: [] };
      }

      // Then get their links and events in parallel
      const [linksResponse, eventsResponse] = await Promise.all([
        this.getArtistLinks(artist.uuid),
        this.getArtistEvents(artist.uuid)
      ]);
      
      return {
        artist,
        links: linksResponse?.links || [],
        upcomingEvents: eventsResponse?.upcoming || [],
        pastEvents: eventsResponse?.past || []
      };
    } catch (error) {
      console.error('Error in VibrateService.getArtistWithLinksAndEvents:', error);
      return { artist: null, links: [], upcomingEvents: [], pastEvents: [] };
    }
  }

  // Get artist data with all available info (combines search + links + events + audience + bio + spotify listeners + instagram audience + tiktok audience + youtube audience calls)
  static async getArtistWithAllData(artistName: string): Promise<{
    artist: VibrateArtist | null;
    links: VibrateArtistLink[];
    upcomingEvents: VibrateEvent[];
    pastEvents: VibrateEvent[];
    audience: VibrateAudienceData;
    bio: VibrateBioData;
    spotifyListeners: VibrateSpotifyListenersData;
    instagramAudience: VibrateInstagramAudienceData;
    tiktokAudience: VibrateTikTokAudienceData;
    youtubeAudience: VibrateYouTubeAudienceData;
  }> {
    try {
      // First get the artist data
      const artist = await this.getExactArtistMatch(artistName);
      
      if (!artist?.uuid) {
        return { 
          artist: null, 
          links: [], 
          upcomingEvents: [], 
          pastEvents: [], 
          audience: {}, 
          bio: { BIO: [], FAQ: [] }, 
          spotifyListeners: { byCity: [], byCountry: {} },
          instagramAudience: { byCity: [], byCountry: [], byGender: {} as VibrateInstagramGenderData, byAge: {} },
          tiktokAudience: { byCountry: [], byGender: {} as VibrateTikTokGenderData, byAge: {} },
          youtubeAudience: { byCountry: {}, byGender: {} as VibrateYouTubeGenderData, byAge: {} }
        };
      }

      // Then get their links, events, audience, bio, Spotify listeners, Instagram audience, TikTok audience, and YouTube audience data in parallel
      const [linksResponse, eventsResponse, audienceResponse, bioResponse, spotifyListenersResponse, instagramAudienceResponse, tiktokAudienceResponse, youtubeAudienceResponse] = await Promise.all([
        this.getArtistLinks(artist.uuid),
        this.getArtistEvents(artist.uuid),
        this.getArtistAudience(artist.uuid),
        this.getArtistBio(artist.uuid),
        this.getArtistSpotifyListeners(artist.uuid),
        this.getArtistInstagramAudience(artist.uuid),
        this.getArtistTikTokAudience(artist.uuid),
        this.getArtistYouTubeAudience(artist.uuid)
      ]);
      
      return {
        artist,
        links: linksResponse?.links || [],
        upcomingEvents: eventsResponse?.upcoming || [],
        pastEvents: eventsResponse?.past || [],
        audience: audienceResponse?.audience || {},
        bio: bioResponse?.bio || { BIO: [], FAQ: [] },
        spotifyListeners: spotifyListenersResponse?.listeners || { byCity: [], byCountry: {} },
        instagramAudience: instagramAudienceResponse?.audience || { byCity: [], byCountry: [], byGender: {} as VibrateInstagramGenderData, byAge: {} },
        tiktokAudience: tiktokAudienceResponse?.audience || { byCountry: [], byGender: {} as VibrateTikTokGenderData, byAge: {} },
        youtubeAudience: youtubeAudienceResponse?.audience || { byCountry: {}, byGender: {} as VibrateYouTubeGenderData, byAge: {} }
      };
    } catch (error) {
      console.error('Error in VibrateService.getArtistWithAllData:', error);
      return { 
        artist: null, 
        links: [], 
        upcomingEvents: [], 
        pastEvents: [], 
        audience: {}, 
        bio: { BIO: [], FAQ: [] }, 
        spotifyListeners: { byCity: [], byCountry: {} },
        instagramAudience: { byCity: [], byCountry: [], byGender: {} as VibrateInstagramGenderData, byAge: {} },
        tiktokAudience: { byCountry: [], byGender: {} as VibrateTikTokGenderData, byAge: {} },
        youtubeAudience: { byCountry: {}, byGender: {} as VibrateYouTubeGenderData, byAge: {} }
      };
    }
  }
}