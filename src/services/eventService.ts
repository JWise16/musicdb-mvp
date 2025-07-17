import { supabase } from '../supabaseClient';
import type { Tables } from '../types/database.types';
import { isEventPast } from '../utils/dateUtils';

export type EventFormData = {
  name: string;
  date: string;
  venue_id: string;
  ticket_price?: number;
  ticket_price_min?: number;
  ticket_price_max?: number;
  total_ticket_revenue?: number;
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

export type EventFilters = {
  genre?: string;
  city?: string;
  venueSize?: 'small' | 'medium' | 'large';
  timeFrame?: 'upcoming' | 'past' | 'all';
  percentageSold?: 'low' | 'medium' | 'high';
  searchQuery?: string;
};

export type EventWithDetails = Tables<'events'> & {
  venues: Tables<'venues'>;
  event_artists: Array<{
    artists: Tables<'artists'>;
    is_headliner: boolean;
    performance_order: number;
  }>;
  event_metrics: Tables<'event_metrics'> | null;
  percentage_sold: number;
  total_revenue: number;
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
          ticket_price: eventData.ticket_price || null,
          ticket_price_min: eventData.ticket_price_min || null,
          ticket_price_max: eventData.ticket_price_max || null,
          total_ticket_revenue: eventData.total_ticket_revenue || null,
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
        // Use total_ticket_revenue if provided, otherwise calculate from ticket_price
        const ticketRevenue = eventData.total_ticket_revenue || 
          (eventData.tickets_sold && eventData.ticket_price ? eventData.tickets_sold * eventData.ticket_price : 0);
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

  // Get all events with full details and filtering
  static async getEventsWithFilters(filters: EventFilters = {}): Promise<EventWithDetails[]> {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          venues (*),
          event_artists (
            artists (*),
            is_headliner,
            performance_order
          ),
          event_metrics (*)
        `)
        .order('date', { ascending: false });

      // Apply filters
      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,venues.name.ilike.%${filters.searchQuery}%`);
      }

      if (filters.city) {
        query = query.eq('venues.location', filters.city);
      }

      if (filters.venueSize) {
        const sizeRanges = {
          small: { min: 0, max: 200 },
          medium: { min: 201, max: 1000 },
          large: { min: 1001, max: 999999 }
        };
        const range = sizeRanges[filters.venueSize];
        query = query.gte('venues.capacity', range.min).lte('venues.capacity', range.max);
      }

      if (filters.timeFrame) {
        const now = new Date().toISOString();
        switch (filters.timeFrame) {
          case 'upcoming':
            query = query.gte('date', now);
            break;
          case 'past':
            query = query.lt('date', now);
            break;
          // 'all' doesn't need any filter
        }
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }

      // Process events to add calculated fields and apply remaining filters
      let processedEvents = events?.map(event => {
        const percentageSold = event.tickets_sold && event.total_tickets 
          ? (event.tickets_sold / event.total_tickets) * 100 
          : 0;
        
        const totalRevenue = event.event_metrics?.total_revenue || 
          (event.tickets_sold ? event.tickets_sold * event.ticket_price : 0) + 
          (event.bar_sales || 0);

        return {
          ...event,
          percentage_sold: percentageSold,
          total_revenue: totalRevenue,
        };
      }) || [];

      // Apply percentage sold filter
      if (filters.percentageSold) {
        const percentageRanges = {
          low: { min: 0, max: 33 },
          medium: { min: 34, max: 66 },
          high: { min: 67, max: 100 }
        };
        const range = percentageRanges[filters.percentageSold];
        processedEvents = processedEvents.filter(event => 
          event.percentage_sold >= range.min && event.percentage_sold <= range.max
        );
      }

      // Apply genre filter
      if (filters.genre) {
        processedEvents = processedEvents.filter(event =>
          event.event_artists?.some((ea: any) => 
            ea.artists?.genre?.toLowerCase().includes(filters.genre!.toLowerCase())
          )
        );
      }

      return processedEvents as EventWithDetails[];
    } catch (error) {
      console.error('Error in getEventsWithFilters:', error);
      return [];
    }
  }

  // Get all events (legacy method)
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

  // Get available filter options
  static async getFilterOptions(): Promise<{
    genres: string[];
    cities: string[];
    venueSizes: Array<{ value: string; label: string; count: number }>;
  }> {
    try {
      // Get all events with details to extract filter options
      const events = await this.getEventsWithFilters();
      
      // Extract unique genres
      const genres = new Set<string>();
      events.forEach(event => {
        event.event_artists?.forEach(ea => {
          if (ea.artists?.genre) {
            genres.add(ea.artists.genre);
          }
        });
      });

      // Extract unique cities
      const cities = new Set<string>();
      events.forEach(event => {
        if (event.venues?.location) {
          cities.add(event.venues.location);
        }
      });

      // Calculate venue size distribution
      const venueSizeCounts = {
        small: 0,
        medium: 0,
        large: 0
      };

      events.forEach(event => {
        const capacity = event.venues?.capacity || 0;
        if (capacity <= 200) venueSizeCounts.small++;
        else if (capacity <= 1000) venueSizeCounts.medium++;
        else venueSizeCounts.large++;
      });

      const venueSizes = [
        { value: 'small', label: '≤200', count: venueSizeCounts.small },
        { value: 'medium', label: '201-1000', count: venueSizeCounts.medium },
        { value: 'large', label: '1000+', count: venueSizeCounts.large }
      ];

      return {
        genres: Array.from(genres).sort(),
        cities: Array.from(cities).sort(),
        venueSizes
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return { genres: [], cities: [], venueSizes: [] };
    }
  }

  // Check if an event needs updating (past event without financial data)
  static needsUpdate(event: EventWithDetails): boolean {
    const isPastEvent = isEventPast(event.date);
    const hasFinancialData = event.tickets_sold !== null || event.bar_sales !== null;
    return isPastEvent && !hasFinancialData;
  }

  // Update event with financial data
  static async updateEventFinancials(
    eventId: string, 
    ticketsSold: number, 
    barSales: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update the event with financial data
      const { error: eventError } = await supabase
        .from('events')
        .update({
          tickets_sold: ticketsSold,
          bar_sales: barSales,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (eventError) {
        console.error('Error updating event:', eventError);
        return { success: false, error: eventError.message };
      }

      // Get the event to calculate revenue
      const { data: event } = await supabase
        .from('events')
        .select('ticket_price')
        .eq('id', eventId)
        .single();

      if (event) {
        const ticketRevenue = ticketsSold * event.ticket_price;
        const totalRevenue = ticketRevenue + barSales;
        const barSalesPerAttendee = ticketsSold > 0 ? barSales / ticketsSold : null;

        // Update or create event metrics
        const { error: metricsError } = await supabase
          .from('event_metrics')
          .upsert({
            event_id: eventId,
            attendance: ticketsSold,
            ticket_revenue: ticketRevenue,
            total_revenue: totalRevenue,
            bar_sales_per_attendee: barSalesPerAttendee,
            is_public: true,
            updated_at: new Date().toISOString()
          });

        if (metricsError) {
          console.error('Error updating event metrics:', metricsError);
          return { success: false, error: metricsError.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateEventFinancials:', error);
      return { success: false, error: 'Failed to update event' };
    }
  }
} 