import { supabase } from '../supabaseClient';
import type { Tables } from '../types/database.types';

export type EventFormData = {
  name: string;
  date: string;
  venue_id: string;
  ticket_price: number;
  total_tickets: number;
  tickets_sold?: number;
  bar_sales?: number;
  notes?: string;
  artists: Array<{
    name: string;
    genre?: string;
    is_headliner: boolean;
    performance_order: number;
    contact_info?: string;
    social_media?: any;
  }>;
};

export type ArtistData = {
  name: string;
  genre?: string;
  contact_info?: string;
  social_media?: any;
};

export class EventService {
  // Create a new event with artists
  static async createEvent(eventData: EventFormData): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Start a transaction
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          name: eventData.name,
          date: eventData.date,
          venue_id: eventData.venue_id,
          ticket_price: eventData.ticket_price,
          total_tickets: eventData.total_tickets,
          tickets_sold: eventData.tickets_sold || null,
          bar_sales: eventData.bar_sales || null,
          notes: eventData.notes || null,
        })
        .select()
        .single();

      if (eventError) {
        console.error('Error creating event:', eventError);
        return { success: false, error: eventError.message };
      }

      // Process artists
      for (const artistData of eventData.artists) {
        // Check if artist exists, create if not
        let artistId = await this.getOrCreateArtist(artistData);
        
        if (artistId) {
          // Create event_artist relationship
          const { error: relationError } = await supabase
            .from('event_artists')
            .insert({
              event_id: event.id,
              artist_id: artistId,
              is_headliner: artistData.is_headliner,
              performance_order: artistData.performance_order,
            });

          if (relationError) {
            console.error('Error creating event_artist relation:', relationError);
            // Continue with other artists even if one fails
          }
        }
      }

      // Create event metrics if we have financial data
      if (eventData.tickets_sold || eventData.bar_sales) {
        const ticketRevenue = eventData.tickets_sold ? eventData.tickets_sold * eventData.ticket_price : 0;
        const totalRevenue = ticketRevenue + (eventData.bar_sales || 0);
        const attendance = eventData.tickets_sold || 0;
        const barSalesPerAttendee = eventData.tickets_sold && eventData.bar_sales 
          ? eventData.bar_sales / eventData.tickets_sold 
          : null;

        await supabase
          .from('event_metrics')
          .insert({
            event_id: event.id,
            attendance,
            ticket_revenue: ticketRevenue,
            total_revenue: totalRevenue,
            bar_sales_per_attendee: barSalesPerAttendee,
            is_public: true, // Default to public for now
          });
      }

      return { success: true, eventId: event.id };
    } catch (error) {
      console.error('Error in createEvent:', error);
      return { success: false, error: 'Failed to create event' };
    }
  }

  // Get or create an artist
  static async getOrCreateArtist(artistData: ArtistData): Promise<string | null> {
    try {
      // First, try to find existing artist by name
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('id')
        .eq('name', artistData.name)
        .single();

      if (existingArtist) {
        return existingArtist.id;
      }

      // Create new artist if not found
      const { data: newArtist, error } = await supabase
        .from('artists')
        .insert({
          name: artistData.name,
          genre: artistData.genre || null,
          contact_info: artistData.contact_info || null,
          social_media: artistData.social_media || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating artist:', error);
        return null;
      }

      return newArtist.id;
    } catch (error) {
      console.error('Error in getOrCreateArtist:', error);
      return null;
    }
  }

  // Get venues for the current user
  static async getUserVenues(userId: string): Promise<Tables<'venues'>[]> {
    try {
      const { data: userVenues, error } = await supabase
        .from('user_venues')
        .select(`
          venue_id,
          venues (*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user venues:', error);
        return [];
      }

      // Extract venues from the response
      const venues = userVenues?.map(uv => uv.venues).filter(Boolean) || [];
      return venues as unknown as Tables<'venues'>[];
    } catch (error) {
      console.error('Error in getUserVenues:', error);
      return [];
    }
  }

  // Get all venues (for admin purposes or venue selection)
  static async getAllVenues(): Promise<Tables<'venues'>[]> {
    try {
      const { data: venues, error } = await supabase
        .from('venues')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching venues:', error);
        return [];
      }

      return venues || [];
    } catch (error) {
      console.error('Error in getAllVenues:', error);
      return [];
    }
  }

  // Get event by ID with full details
  static async getEventById(eventId: string): Promise<Tables<'events'> | null> {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select(`
          *,
          venues (*),
          event_artists (
            *,
            artists (*)
          ),
          event_metrics (*)
        `)
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        return null;
      }

      return event;
    } catch (error) {
      console.error('Error in getEventById:', error);
      return null;
    }
  }

  // Get all events
  static async getAllEvents(): Promise<Tables<'events'>[]> {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          venues (*),
          event_artists (
            *,
            artists (*)
          ),
          event_metrics (*)
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }

      return events || [];
    } catch (error) {
      console.error('Error in getAllEvents:', error);
      return [];
    }
  }
} 