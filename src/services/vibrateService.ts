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
} 