import { supabase } from '../supabaseClient';
import type { Tables } from '../types/database.types';
import { parseEventDate } from '../utils/dateUtils';

export type VenueData = {
  name: string;
  location: string;
  address: string;
  capacity?: number;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  image_url?: string;
};

export type UserVenueData = {
  user_id: string;
  venue_id: string;
  role: string;
};

export type VenueAnalytics = {
  showsReported: number;
  ticketSales: number;
  barSales: number;
  avgSelloutRate: number;
  avgTicketPrice: number;
  topMonth: { month: string; count: number };
  topGenre: { genre: string; count: number };
  topArtist: { name: string; count: number };
};

export type VenueEvent = Tables<'events'> & {
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

export class VenueService {
  // Get venues associated with a user
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

  // Check if user has any associated venues
  static async hasUserVenues(userId: string): Promise<boolean> {
    console.log('VenueService: hasUserVenues called with userId:', userId);
    try {
      const { data, error } = await supabase
        .from('user_venues')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      console.log('VenueService: hasUserVenues query result:', { data, error });

      if (error) {
        console.error('Error checking user venues:', error);
        return false;
      }

      const hasVenues = (data?.length || 0) > 0;
      console.log('VenueService: hasUserVenues returning:', hasVenues);
      return hasVenues;
    } catch (error) {
      console.error('Error in hasUserVenues:', error);
      return false;
    }
  }

  // Search for existing venues by name or location
  static async searchVenues(query: string): Promise<Tables<'venues'>[]> {
    try {
      const { data: venues, error } = await supabase
        .from('venues')
        .select('*')
        .or(`name.ilike.%${query}%,location.ilike.%${query}%`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Error searching venues:', error);
        return [];
      }

      return venues || [];
    } catch (error) {
      console.error('Error in searchVenues:', error);
      return [];
    }
  }

  // Create a new venue
  static async createVenue(venueData: VenueData): Promise<{ success: boolean; venueId?: string; error?: string }> {
    try {
      const { data: venue, error } = await supabase
        .from('venues')
        .insert(venueData)
        .select()
        .single();

      if (error) {
        console.error('Error creating venue:', error);
        return { success: false, error: error.message };
      }

      return { success: true, venueId: venue.id };
    } catch (error) {
      console.error('Error in createVenue:', error);
      return { success: false, error: 'Failed to create venue' };
    }
  }

  // Associate a user with a venue
  static async associateUserWithVenue(userVenueData: UserVenueData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_venues')
        .insert(userVenueData);

      if (error) {
        console.error('Error associating user with venue:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in associateUserWithVenue:', error);
      return { success: false, error: 'Failed to associate user with venue' };
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

  // Get venue by ID
  static async getVenueById(venueId: string): Promise<Tables<'venues'> | null> {
    try {
      const { data: venue, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single();

      if (error) {
        console.error('Error fetching venue:', error);
        return null;
      }

      return venue;
    } catch (error) {
      console.error('Error in getVenueById:', error);
      return null;
    }
  }

  // Upload venue image
  static async uploadVenueImage(venueId: string, file: File): Promise<{ url: string | null; error: string | null }> {
    try {
      console.log('Starting venue image upload for venue:', venueId);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${venueId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Uploading to path:', filePath);

      // Upload file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('venue-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        });

      if (uploadError) {
        console.error('Error uploading venue image:', uploadError);
        return { url: null, error: uploadError.message };
      }

      console.log('Upload successful, data:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('venue-images')
        .getPublicUrl(filePath);

      console.log('Public URL:', urlData.publicUrl);

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('Error in uploadVenueImage:', error);
      return { url: null, error: 'Failed to upload venue image' };
    }
  }

  // Delete venue image
  static async deleteVenueImage(_venueId: string, imageUrl: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${fileName}`;

      // Delete file from Supabase Storage
      const { error } = await supabase.storage
        .from('venue-images')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting venue image:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in deleteVenueImage:', error);
      return { success: false, error: 'Failed to delete venue image' };
    }
  }

  // Create venue with image
  static async createVenueWithImage(
    venueData: VenueData, 
    imageFile?: File
  ): Promise<{ success: boolean; venueId?: string; error?: string }> {
    try {
      let imageUrl = venueData.image_url;

      // Upload image if provided
      if (imageFile) {
        // First create the venue to get the ID
        const createResult = await this.createVenue(venueData);
        if (!createResult.success || !createResult.venueId) {
          return createResult;
        }

        // Upload image using the venue ID
        const uploadResult = await this.uploadVenueImage(createResult.venueId, imageFile);
        if (uploadResult.error) {
          return { success: false, error: uploadResult.error };
        }
        imageUrl = uploadResult.url || undefined;

        // Update venue with image URL
        const { error: updateError } = await supabase
          .from('venues')
          .update({ image_url: imageUrl })
          .eq('id', createResult.venueId);

        if (updateError) {
          console.error('Error updating venue with image URL:', updateError);
          return { success: false, error: updateError.message };
        }

        return { success: true, venueId: createResult.venueId };
      } else {
        // No image, just create venue
        return await this.createVenue(venueData);
      }
    } catch (error) {
      console.error('Error in createVenueWithImage:', error);
      return { success: false, error: 'Failed to create venue with image' };
    }
  }

  // Get venue analytics for a specific venue
  static async getVenueAnalytics(venueId: string, timeFrame: 'YTD' | 'MTD' | 'ALL' = 'YTD'): Promise<VenueAnalytics> {
    try {
      // Get date range based on timeFrame
      const now = new Date();
      let startDate: string | null = null;
      
      if (timeFrame === 'YTD') {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      } else if (timeFrame === 'MTD') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }

      // Build query for events
      let eventsQuery = supabase
        .from('events')
        .select(`
          *,
          event_artists (
            artists (*)
          ),
          event_metrics (*)
        `)
        .eq('venue_id', venueId);

      if (startDate) {
        eventsQuery = eventsQuery.gte('date', startDate);
      }

      const { data: events, error } = await eventsQuery;

      if (error) {
        console.error('Error fetching venue events:', error);
        return this.getDefaultAnalytics();
      }

      if (!events || events.length === 0) {
        return this.getDefaultAnalytics();
      }

      // Calculate analytics
      const showsReported = events.length;
      let totalBarSales = 0;
      let totalTicketsSold = 0;
      let totalTicketsAvailable = 0;
      let totalTicketRevenue = 0;

      // Track months, genres, and artists
      const monthCounts: { [key: string]: number } = {};
      const genreCounts: { [key: string]: number } = {};
      const artistCounts: { [key: string]: number } = {};

      events.forEach(event => {
        // Financial calculations
        const ticketsSold = event.tickets_sold || 0;
        const ticketPrice = event.ticket_price || 0;
        const barSales = event.bar_sales || 0;
        const totalTickets = event.total_tickets || 0;

        totalTicketsSold += ticketsSold;
        totalTicketsAvailable += totalTickets;
        totalTicketRevenue += ticketsSold * ticketPrice;
        totalBarSales += barSales;

        // Month tracking
        const eventDate = parseEventDate(event.date);
        const monthKey = eventDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;

        // Genre and artist tracking
        event.event_artists?.forEach((ea: any) => {
          if (ea.artists?.name) {
            artistCounts[ea.artists.name] = (artistCounts[ea.artists.name] || 0) + 1;
          }
          if (ea.artists?.genre) {
            genreCounts[ea.artists.genre] = (genreCounts[ea.artists.genre] || 0) + 1;
          }
        });
      });

      // Calculate averages
      const avgSelloutRate = totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0;
      const avgTicketPrice = showsReported > 0 ? totalTicketRevenue / totalTicketsSold : 0;

      // Find top performers
      const topMonth = Object.entries(monthCounts)
        .sort(([,a], [,b]) => b - a)[0] || { month: 'N/A', count: 0 };
      
      const topGenre = Object.entries(genreCounts)
        .sort(([,a], [,b]) => b - a)[0] || { genre: 'N/A', count: 0 };
      
      const topArtist = Object.entries(artistCounts)
        .sort(([,a], [,b]) => b - a)[0] || { name: 'N/A', count: 0 };

      return {
        showsReported,
        ticketSales: totalTicketRevenue,
        barSales: totalBarSales,
        avgSelloutRate,
        avgTicketPrice,
        topMonth: { month: topMonth[0], count: topMonth[1] },
        topGenre: { genre: topGenre[0], count: topGenre[1] },
        topArtist: { name: topArtist[0], count: topArtist[1] }
      };
    } catch (error) {
      console.error('Error in getVenueAnalytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  // Get venue events (past and upcoming)
  static async getVenueEvents(venueId: string): Promise<{
    upcoming: VenueEvent[];
    past: VenueEvent[];
  }> {
    try {
      const now = new Date().toISOString();
      
      // Get all events for the venue
      const { data: events, error } = await supabase
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
        .eq('venue_id', venueId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching venue events:', error);
        return { upcoming: [], past: [] };
      }

      if (!events) {
        return { upcoming: [], past: [] };
      }

      // Process events and separate by date
      const processedEvents = events.map(event => {
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
      });

      const upcoming = processedEvents.filter(event => event.date >= now);
      const past = processedEvents.filter(event => event.date < now);

      return { upcoming, past };
    } catch (error) {
      console.error('Error in getVenueEvents:', error);
      return { upcoming: [], past: [] };
    }
  }

  // Get analytics for all user venues combined
  static async getUserVenuesAnalytics(userId: string, timeFrame: 'YTD' | 'MTD' | 'ALL' = 'YTD'): Promise<VenueAnalytics> {
    try {
      const userVenues = await this.getUserVenues(userId);
      
      if (userVenues.length === 0) {
        return this.getDefaultAnalytics();
      }

      // Get analytics for all venues and combine them
      const venueAnalytics = await Promise.all(
        userVenues.map(venue => this.getVenueAnalytics(venue.id, timeFrame))
      );

      // Combine analytics
      const combined = venueAnalytics.reduce((acc, analytics) => ({
        showsReported: acc.showsReported + analytics.showsReported,
        ticketSales: acc.ticketSales + analytics.ticketSales,
        barSales: acc.barSales + analytics.barSales,
        avgSelloutRate: acc.avgSelloutRate + analytics.avgSelloutRate,
        avgTicketPrice: acc.avgTicketPrice + analytics.avgTicketPrice,
        topMonth: analytics.topMonth.count > acc.topMonth.count ? analytics.topMonth : acc.topMonth,
        topGenre: analytics.topGenre.count > acc.topGenre.count ? analytics.topGenre : acc.topGenre,
        topArtist: analytics.topArtist.count > acc.topArtist.count ? analytics.topArtist : acc.topArtist,
      }), this.getDefaultAnalytics());

      // Calculate averages
      const venueCount = venueAnalytics.length;
      if (venueCount > 0) {
        combined.avgSelloutRate = combined.avgSelloutRate / venueCount;
        combined.avgTicketPrice = combined.avgTicketPrice / venueCount;
      }

      return combined;
    } catch (error) {
      console.error('Error in getUserVenuesAnalytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  // Get events for all user venues
  static async getUserVenuesEvents(userId: string): Promise<{
    upcoming: VenueEvent[];
    past: VenueEvent[];
  }> {
    try {
      const userVenues = await this.getUserVenues(userId);
      
      if (userVenues.length === 0) {
        return { upcoming: [], past: [] };
      }

      // Get events for all venues
      const venueEvents = await Promise.all(
        userVenues.map(venue => this.getVenueEvents(venue.id))
      );

      // Combine all events
      const allUpcoming = venueEvents.flatMap(events => events.upcoming);
      const allPast = venueEvents.flatMap(events => events.past);

      // Sort by date
      allUpcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      allPast.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        upcoming: allUpcoming,
        past: allPast
      };
    } catch (error) {
      console.error('Error in getUserVenuesEvents:', error);
      return { upcoming: [], past: [] };
    }
  }

  // Default analytics for empty state
  private static getDefaultAnalytics(): VenueAnalytics {
    return {
      showsReported: 0,
      ticketSales: 0,
      barSales: 0,
      avgSelloutRate: 0,
      avgTicketPrice: 0,
      topMonth: { month: 'N/A', count: 0 },
      topGenre: { genre: 'N/A', count: 0 },
      topArtist: { name: 'N/A', count: 0 }
    };
  }
} 