import { supabase } from '../supabaseClient';
import type { Tables } from '../database.types';

export type ArtistWithEvents = Tables<'artists'> & {
  events: Array<Tables<'events'> & {
    venues: Tables<'venues'>;
    is_headliner: boolean;
    performance_order: number;
  }>;
};

export class ArtistService {
  // Get artist by ID with their events
  static async getArtistWithEvents(artistId: string): Promise<ArtistWithEvents | null> {
    try {
      // First get the artist
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();

      if (artistError) {
        console.error('Error fetching artist:', artistError);
        return null;
      }

      // Then get their events through the event_artists relationship
      const { data: eventArtists, error: eventsError } = await supabase
        .from('event_artists')
        .select(`
          is_headliner,
          performance_order,
          events (
            *,
            venues (*)
          )
        `)
        .eq('artist_id', artistId)
        .order('events(date)', { ascending: false });

      if (eventsError) {
        console.error('Error fetching artist events:', eventsError);
        return null;
      }

      // Transform the data to include event details with artist relationship info
      const events = eventArtists?.map((ea: any) => ({
        ...ea.events,
        is_headliner: ea.is_headliner,
        performance_order: ea.performance_order
      })) || [];

      return {
        ...artist,
        events
      };
    } catch (error) {
      console.error('Error in getArtistWithEvents:', error);
      return null;
    }
  }

  // Get the primary artist from an event (prioritizing headliners)
  static async getPrimaryArtistFromEvent(eventId: string): Promise<string | null> {
    try {
      // First try to find a headliner
      const { data: headliner, error: headlinerError } = await supabase
        .from('event_artists')
        .select('artist_id')
        .eq('event_id', eventId)
        .eq('is_headliner', true)
        .order('performance_order', { ascending: true })
        .limit(1)
        .single();

      if (!headlinerError && headliner) {
        return headliner.artist_id;
      }

      // If no headliner, get the first supporting artist
      const { data: supportingArtist, error: supportingError } = await supabase
        .from('event_artists')
        .select('artist_id')
        .eq('event_id', eventId)
        .order('performance_order', { ascending: true })
        .limit(1)
        .single();

      if (!supportingError && supportingArtist) {
        return supportingArtist.artist_id;
      }

      return null;
    } catch (error) {
      console.error('Error in getPrimaryArtistFromEvent:', error);
      return null;
    }
  }

  // Get all artists
  static async getAllArtists(): Promise<Tables<'artists'>[]> {
    try {
      const { data: artists, error } = await supabase
        .from('artists')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching artists:', error);
        return [];
      }

      return artists || [];
    } catch (error) {
      console.error('Error in getAllArtists:', error);
      return [];
    }
  }

  // Search artists by name
  static async searchArtists(query: string): Promise<Tables<'artists'>[]> {
    try {
      const { data: artists, error } = await supabase
        .from('artists')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error searching artists:', error);
        return [];
      }

      return artists || [];
    } catch (error) {
      console.error('Error in searchArtists:', error);
      return [];
    }
  }
} 