import { supabase } from '../supabaseClient';
import type { Tables } from '../database.types';
import { VibrateService } from './vibrateService';

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

  // Get or resolve Viberate UUID for an artist
  static async getOrResolveVibrateUuid(artistId: string): Promise<string | null> {
    try {
      // Always check our database first, since both database IDs and Viberate UUIDs use UUID format
      console.log(`🔍 ArtistService: Resolving artist ID "${artistId}" to Viberate UUID`);
      
      // Check if this looks like a UUID format (but could be either database ID or Viberate UUID)
      const isUuidFormat = artistId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUuidFormat) {
        console.log(`🔍 ArtistService: "${artistId}" has UUID format, checking if it's a database ID or Viberate UUID`);
      }

      // Get the artist from our database
      console.log(`🔍 ArtistService: Looking up local database artist with ID: "${artistId}"`);
      const { data: artist, error } = await supabase
        .from('artists')
        .select('id, name, viberate_uuid')
        .eq('id', artistId)
        .single();

      if (error || !artist) {
        console.log(`🔍 ArtistService: No local artist found with ID "${artistId}". Checking if this might be a direct Viberate UUID...`);
        
        // If no local artist found, this might be a direct Vibrate UUID from the search page
        // Check if it's a valid UUID format and might be a Vibrate UUID
        if (isUuidFormat) {
          console.log(`✅ ArtistService: "${artistId}" is UUID format and not in our database. Treating as direct Vibrate UUID.`);
          return artistId;
        }
        
        console.error('❌ ArtistService: No artist found and not a valid UUID format');
        return null;
      }

      console.log(`✅ ArtistService: Found artist "${artist.name}" with ID: "${artist.id}", viberate_uuid: ${artist.viberate_uuid || 'NULL'}`);

      // If we already have a Viberate UUID, return it
      if (artist.viberate_uuid) {
        console.log(`✅ ArtistService: Artist already has Viberate UUID: "${artist.viberate_uuid}"`);
        return artist.viberate_uuid;
      }

      // Important: If the artistId we received is actually our database ID,
      // but there's no viberate_uuid, we need to find the Viberate UUID
      console.log(`🔍 ArtistService: Artist "${artist.name}" (ID: ${artist.id}) has no Viberate UUID. Searching Viberate API...`);
      
      // Search Viberate API for this artist by name
      console.log(`🔍 ArtistService: Searching Viberate API for artist: "${artist.name}"`);
      const searchResponse = await VibrateService.searchArtists(artist.name);
      
      if (searchResponse?.artists?.length) {
        // Use the first (best) match
        const vibrateArtist = searchResponse.artists[0];
        const vibrateUuid = vibrateArtist.uuid;
        console.log(`✅ ArtistService: Found Viberate match: "${vibrateArtist.name}" with UUID: "${vibrateUuid}"`);

        // Update our database with the resolved UUID
        const { error: updateError } = await supabase
          .from('artists')
          .update({ viberate_uuid: vibrateUuid })
          .eq('id', artist.id); // Use artist.id to be explicit

        if (updateError) {
          console.error('❌ ArtistService: Error updating artist with Viberate UUID:', updateError);
        } else {
          console.log(`✅ ArtistService: Successfully cached Viberate UUID "${vibrateUuid}" for artist "${artist.name}"`);
        }

        return vibrateUuid;
      }

      console.log(`❌ ArtistService: No Viberate match found for artist: "${artist.name}"`);
      return null;
    } catch (error) {
      console.error('Error in getOrResolveVibrateUuid:', error);
      return null;
    }
  }

  // Update an artist's Viberate UUID
  static async updateVibrateUuid(artistId: string, vibrateUuid: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('artists')
        .update({ viberate_uuid: vibrateUuid })
        .eq('id', artistId);

      if (error) {
        console.error('Error updating artist Viberate UUID:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateVibrateUuid:', error);
      return false;
    }
  }
} 