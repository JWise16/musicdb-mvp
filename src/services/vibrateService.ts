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
} 