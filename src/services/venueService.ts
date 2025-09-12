import { supabase } from '../supabaseClient';
import type { Tables } from '../database.types';
import { parseEventDate } from '../utils/dateUtils';
import { AdminService } from './adminService';
import { VibrateService } from './vibrateService';

// Temporary inline types - will move back to separate file once module resolution is fixed
interface BookingIntelligenceMetrics {
  spotifyFollowers: number;
  youtubeSubscribers: number;
  instagramFollowers: number;
  tiktokFollowers: number;
  spotifyListenersLocal: number;
  totalPerformances: number;
  localPerformances: number;
}

interface BookingIntelligenceFilters {
  percentSoldRange: [number, number];
  genres: string[];
  timeFrame: 'month' | '3months' | '6months' | '12months' | 'all';
}

interface BookingIntelligenceData {
  metrics: BookingIntelligenceMetrics;
  artistCount: number;
  eventCount: number;
  dateRange: {
    from: string;
    to: string;
  } | null;
  venue: {
    id: string;
    name: string;
    city: string;
  };
  lastUpdated: string;
  appliedFilters: BookingIntelligenceFilters;
}

interface BookingIntelligenceError {
  code: 'NO_VENUE' | 'NO_EVENTS' | 'NO_ARTISTS' | 'API_ERROR' | 'UNKNOWN';
  message: string;
  details?: Record<string, any>;
}

interface BookingIntelligenceResult {
  data: BookingIntelligenceData | null;
  error: BookingIntelligenceError | null;
  success: boolean;
}

interface GetBookingIntelligenceParams {
  venueId: string;
  filters: BookingIntelligenceFilters;
  forceRefresh?: boolean;
}

interface ArtistBookingDataPoint {
  artistId: string;
  artistName: string;
  eventId: string;
  bookingDate: string;
  genre: string | null;
  percentageSold: number;
  socialMetrics: {
    spotifyFollowers: number | null;
    youtubeSubscribers: number | null;
    instagramFollowers: number | null;
    tiktokFollowers: number | null;
    spotifyListenersLocal: number | null;
  };
  isHeadliner: boolean;
}

export type VenueData = {
  name: string;
  location: string;
  address: string;
  capacity?: number;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  image_url?: string;
  is_public?: boolean;
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
  topMonth: { month: string; count: number; avgPercentageSold: number };
  topGenre: { genre: string; count: number; avgPercentageSold: number };
  topArtist: { name: string; count: number; avgPercentageSold: number };
  trends: {
    showsReported: { value: number; date: string; formattedDate: string }[];
    ticketSales: { value: number; date: string; formattedDate: string }[];
    barSales: { value: number; date: string; formattedDate: string }[];
    avgSelloutRate: { value: number; date: string; formattedDate: string }[];
    avgTicketPrice: { value: number; date: string; formattedDate: string }[];
  };
  monthlyPercentageSold: Array<{
    month: string;
    percentage: number;
  }>;
  quarterlyPercentageSold: Array<{
    quarter: string;
    percentage: number;
  }>;
  yearlyPercentageSold: Array<{
    year: string;
    percentage: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  quarterlyRevenue: Array<{
    quarter: string;
    revenue: number;
  }>;
  yearlyRevenue: Array<{
    year: string;
    revenue: number;
  }>;
  monthlyGenreBreakdown: Array<{
    month: string;
    genres: Array<{
      genre: string;
      percentage: number;
    }>;
  }>;
  quarterlyGenreBreakdown: Array<{
    quarter: string;
    genres: Array<{
      genre: string;
      percentage: number;
    }>;
  }>;
  yearlyGenreBreakdown: Array<{
    year: string;
    genres: Array<{
      genre: string;
      percentage: number;
    }>;
  }>;
  monthlyGenreRevenue: Array<{
    month: string;
    genres: Array<{
      genre: string;
      revenue: number;
    }>;
  }>;
  quarterlyGenreRevenue: Array<{
    quarter: string;
    genres: Array<{
      genre: string;
      revenue: number;
    }>;
  }>;
  yearlyGenreRevenue: Array<{
    year: string;
    genres: Array<{
      genre: string;
      revenue: number;
    }>;
  }>;
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
  // Cache for hasUserVenues results to prevent repeated API calls
  private static hasUserVenuesCache = new Map<string, { result: boolean; timestamp: number }>();
  private static readonly CACHE_DURATION = 30000; // 30 seconds cache
  private static activeRequests = new Map<string, Promise<boolean>>();

  // Get venues associated with a user
  static async getUserVenues(userId: string): Promise<Tables<'venues'>[]> {
    console.log('VenueService: getUserVenues called with userId:', userId, {
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    
    try {
      console.log('VenueService: Making Supabase query for user venues');
      const { data: userVenues, error } = await supabase
        .from('user_venues')
        .select(`
          venue_id,
          venues (*)
        `)
        .eq('user_id', userId);

      const endTime = Date.now();
      console.log('VenueService: Supabase query completed', {
        duration: `${endTime - startTime}ms`,
        dataCount: userVenues?.length || 0,
        error: error?.message || null,
        timestamp: new Date().toISOString()
      });

      if (error) {
        console.error('VenueService: Error fetching user venues:', error);
        return [];
      }

      // Extract venues from the response
      const venues = userVenues?.map(uv => uv.venues).filter(Boolean) || [];
      console.log('VenueService: getUserVenues returning venues', {
        venueCount: venues.length,
        venueIds: venues.map((v: any) => v.id),
        timestamp: new Date().toISOString()
      });
      
      return venues as unknown as Tables<'venues'>[];
    } catch (error) {
      const endTime = Date.now();
      console.error('VenueService: Error in getUserVenues:', error, {
        duration: `${endTime - startTime}ms`,
        userId,
        timestamp: new Date().toISOString()
      });
      return [];
    }
  }

  // Check if user has any associated venues (with caching to prevent repeated calls)
  static async hasUserVenues(userId: string): Promise<boolean> {
    console.log('VenueService: hasUserVenues called with userId:', userId);
    
    // Check cache first
    const now = Date.now();
    const cached = this.hasUserVenuesCache.get(userId);
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log('VenueService: hasUserVenues returning cached result:', cached.result);
      return cached.result;
    }

    // Check if there's already an active request for this user
    const activeRequest = this.activeRequests.get(userId);
    if (activeRequest) {
      console.log('VenueService: hasUserVenues waiting for active request');
      return activeRequest;
    }

    // Create new request
    const requestPromise = this.performHasUserVenuesQuery(userId);
    this.activeRequests.set(userId, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the result
      this.hasUserVenuesCache.set(userId, { result, timestamp: now });
      console.log('VenueService: hasUserVenues returning and caching result:', result);
      
      return result;
    } finally {
      // Clean up active request
      this.activeRequests.delete(userId);
    }
  }

  // Private method to perform the actual database query
  private static async performHasUserVenuesQuery(userId: string): Promise<boolean> {
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
      return hasVenues;
    } catch (error) {
      console.error('Error in hasUserVenues query:', error);
      return false;
    }
  }

  // Method to clear cache (useful when venues are added/removed)
  static clearHasUserVenuesCache(userId?: string) {
    if (userId) {
      this.hasUserVenuesCache.delete(userId);
      console.log('VenueService: Cleared hasUserVenues cache for user:', userId);
    } else {
      this.hasUserVenuesCache.clear();
      console.log('VenueService: Cleared all hasUserVenues cache');
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

      // Note: We don't track venue creation activity here because we don't know the user_id
      // Activity tracking happens in associateUserWithVenue when we know which user created it

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

      // Clear cache since user now has venues
      this.clearHasUserVenuesCache(userVenueData.user_id);

      // Track venue creation activity when user is associated
      if (userVenueData.user_id) {
        try {
          await AdminService.recordUserActivity(
            userVenueData.user_id,
            'venue_created',
            { 
              venue_id: userVenueData.venue_id,
              role: userVenueData.role,
              timestamp: new Date().toISOString()
            }
          );
        } catch (activityError) {
          console.error('Failed to record venue creation activity:', activityError);
          // Don't fail the venue association if activity tracking fails
        }
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
        return this.getDefaultAnalytics(timeFrame);
      }

      if (!events || events.length === 0) {
        return this.getDefaultAnalytics(timeFrame);
      }

      // Calculate analytics
      const showsReported = events.length;
      let totalBarSales = 0;
      let totalTicketsSold = 0;
      let totalTicketsAvailable = 0;
      let totalTicketRevenue = 0;

      // Track months, genres, and artists with counts and percentage sold data
      const monthData: { [key: string]: { count: number; totalPercentageSold: number } } = {};
      const genreData: { [key: string]: { count: number; totalPercentageSold: number } } = {};
      const artistData: { [key: string]: { count: number; totalPercentageSold: number } } = {};

      events.forEach(event => {
        // Financial calculations
        const ticketsSold = event.tickets_sold || 0;
        const ticketRevenue = event.total_ticket_revenue || 0;
        const barSales = event.bar_sales || 0;
        const totalTickets = event.total_tickets || 0;

        totalTicketsSold += ticketsSold;
        totalTicketsAvailable += totalTickets;
        totalTicketRevenue += ticketRevenue;
        totalBarSales += barSales;

        // Calculate percentage sold for this event
        const eventPercentageSold = totalTickets > 0 ? (ticketsSold / totalTickets) * 100 : 0;

        // Month tracking
        const eventDate = parseEventDate(event.date);
        const monthKey = eventDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!monthData[monthKey]) {
          monthData[monthKey] = { count: 0, totalPercentageSold: 0 };
        }
        monthData[monthKey].count += 1;
        monthData[monthKey].totalPercentageSold += eventPercentageSold;

        // Genre and artist tracking
        event.event_artists?.forEach((ea: any) => {
          if (ea.artists?.name) {
            if (!artistData[ea.artists.name]) {
              artistData[ea.artists.name] = { count: 0, totalPercentageSold: 0 };
            }
            artistData[ea.artists.name].count += 1;
            artistData[ea.artists.name].totalPercentageSold += eventPercentageSold;
          }
          if (ea.artists?.genre) {
            if (!genreData[ea.artists.genre]) {
              genreData[ea.artists.genre] = { count: 0, totalPercentageSold: 0 };
            }
            genreData[ea.artists.genre].count += 1;
            genreData[ea.artists.genre].totalPercentageSold += eventPercentageSold;
          }
        });
      });

      // Calculate averages
      const avgSelloutRate = totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0;
      const avgTicketPrice = totalTicketsSold > 0 ? totalTicketRevenue / totalTicketsSold : 0;

      // Find top performers based on average percentage sold
      const topMonthEntry = Object.entries(monthData)
        .map(([month, data]) => ({
          month,
          count: data.count,
          avgPercentageSold: data.count > 0 ? data.totalPercentageSold / data.count : 0
        }))
        .sort((a, b) => b.avgPercentageSold - a.avgPercentageSold)[0];
      
      const topGenreEntry = Object.entries(genreData)
        .map(([genre, data]) => ({
          genre,
          count: data.count,
          avgPercentageSold: data.count > 0 ? data.totalPercentageSold / data.count : 0
        }))
        .sort((a, b) => b.avgPercentageSold - a.avgPercentageSold)[0];
      
      const topArtistEntry = Object.entries(artistData)
        .map(([name, data]) => ({
          name,
          count: data.count,
          avgPercentageSold: data.count > 0 ? data.totalPercentageSold / data.count : 0
        }))
        .sort((a, b) => b.avgPercentageSold - a.avgPercentageSold)[0];

      const topMonth = topMonthEntry || { month: 'N/A', count: 0, avgPercentageSold: 0 };
      const topGenre = topGenreEntry || { genre: 'N/A', count: 0, avgPercentageSold: 0 };
      const topArtist = topArtistEntry || { name: 'N/A', count: 0, avgPercentageSold: 0 };

      // Calculate trends based on timeframe
      const trends = this.calculateTrends(events, timeFrame);
      
      // Calculate percentage sold data for different time periods
      const monthlyPercentageSold = this.calculateMonthlyPercentageSold(events);
      const quarterlyPercentageSold = this.calculateQuarterlyPercentageSold(events);
      const yearlyPercentageSold = this.calculateYearlyPercentageSold(events);
      
      // Calculate revenue data for different time periods
      const monthlyRevenue = this.calculateMonthlyRevenue(events);
      const quarterlyRevenue = this.calculateQuarterlyRevenue(events);
      const yearlyRevenue = this.calculateYearlyRevenue(events);
      
      // Calculate genre breakdown data for different time periods
      const monthlyGenreBreakdown = this.calculateMonthlyGenreBreakdown(events);
      const quarterlyGenreBreakdown = this.calculateQuarterlyGenreBreakdown(events);
      const yearlyGenreBreakdown = this.calculateYearlyGenreBreakdown(events);
      
      // Calculate genre revenue breakdown data for different time periods
      const monthlyGenreRevenue = this.calculateMonthlyGenreRevenue(events);
      const quarterlyGenreRevenue = this.calculateQuarterlyGenreRevenue(events);
      const yearlyGenreRevenue = this.calculateYearlyGenreRevenue(events);

      return {
        showsReported,
        ticketSales: totalTicketRevenue,
        barSales: totalBarSales,
        avgSelloutRate,
        avgTicketPrice,
        topMonth: { month: topMonth.month, count: topMonth.count, avgPercentageSold: Math.round(topMonth.avgPercentageSold) },
        topGenre: { genre: topGenre.genre, count: topGenre.count, avgPercentageSold: Math.round(topGenre.avgPercentageSold) },
        topArtist: { name: topArtist.name, count: topArtist.count, avgPercentageSold: Math.round(topArtist.avgPercentageSold) },
        trends,
        monthlyPercentageSold,
        quarterlyPercentageSold,
        yearlyPercentageSold,
        monthlyRevenue,
        quarterlyRevenue,
        yearlyRevenue,
        monthlyGenreBreakdown,
        quarterlyGenreBreakdown,
        yearlyGenreBreakdown,
        monthlyGenreRevenue,
        quarterlyGenreRevenue,
        yearlyGenreRevenue
      };
    } catch (error) {
      console.error('Error in getVenueAnalytics:', error);
      return this.getDefaultAnalytics('YTD');
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
          (event.total_ticket_revenue || 0) + 
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
        return this.getDefaultAnalytics('YTD');
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
        trends: {
          showsReported: acc.trends.showsReported.map((point, index) => ({
            value: point.value + (analytics.trends.showsReported[index]?.value || 0),
            date: point.date,
            formattedDate: point.formattedDate
          })),
          ticketSales: acc.trends.ticketSales.map((point, index) => ({
            value: point.value + (analytics.trends.ticketSales[index]?.value || 0),
            date: point.date,
            formattedDate: point.formattedDate
          })),
          barSales: acc.trends.barSales.map((point, index) => ({
            value: point.value + (analytics.trends.barSales[index]?.value || 0),
            date: point.date,
            formattedDate: point.formattedDate
          })),
          avgSelloutRate: acc.trends.avgSelloutRate.map((point, index) => ({
            value: point.value + (analytics.trends.avgSelloutRate[index]?.value || 0),
            date: point.date,
            formattedDate: point.formattedDate
          })),
          avgTicketPrice: acc.trends.avgTicketPrice.map((point, index) => ({
            value: point.value + (analytics.trends.avgTicketPrice[index]?.value || 0),
            date: point.date,
            formattedDate: point.formattedDate
          }))
        },
        monthlyPercentageSold: acc.monthlyPercentageSold.map((monthData, index) => ({
          month: monthData.month,
          percentage: monthData.percentage + (analytics.monthlyPercentageSold[index]?.percentage || 0)
        })),
        quarterlyPercentageSold: acc.quarterlyPercentageSold.map((quarterData, index) => ({
          quarter: quarterData.quarter,
          percentage: quarterData.percentage + (analytics.quarterlyPercentageSold[index]?.percentage || 0)
        })),
        yearlyPercentageSold: acc.yearlyPercentageSold.map((yearData, index) => ({
          year: yearData.year,
          percentage: yearData.percentage + (analytics.yearlyPercentageSold[index]?.percentage || 0)
        })),
        monthlyRevenue: acc.monthlyRevenue.map((monthData, index) => ({
          month: monthData.month,
          revenue: monthData.revenue + (analytics.monthlyRevenue[index]?.revenue || 0)
        })),
        quarterlyRevenue: acc.quarterlyRevenue.map((quarterData, index) => ({
          quarter: quarterData.quarter,
          revenue: quarterData.revenue + (analytics.quarterlyRevenue[index]?.revenue || 0)
        })),
        yearlyRevenue: acc.yearlyRevenue.map((yearData, index) => ({
          year: yearData.year,
          revenue: yearData.revenue + (analytics.yearlyRevenue[index]?.revenue || 0)
        })),
        monthlyGenreBreakdown: this.combineGenreBreakdown(acc.monthlyGenreBreakdown, analytics.monthlyGenreBreakdown),
        quarterlyGenreBreakdown: this.combineGenreBreakdown(acc.quarterlyGenreBreakdown, analytics.quarterlyGenreBreakdown),
        yearlyGenreBreakdown: this.combineGenreBreakdown(acc.yearlyGenreBreakdown, analytics.yearlyGenreBreakdown),
        monthlyGenreRevenue: this.combineGenreRevenue(acc.monthlyGenreRevenue, analytics.monthlyGenreRevenue),
        quarterlyGenreRevenue: this.combineGenreRevenue(acc.quarterlyGenreRevenue, analytics.quarterlyGenreRevenue),
        yearlyGenreRevenue: this.combineGenreRevenue(acc.yearlyGenreRevenue, analytics.yearlyGenreRevenue)
      }), this.getDefaultAnalytics('YTD'));

      // Calculate averages
      const venueCount = venueAnalytics.length;
      if (venueCount > 0) {
        combined.avgSelloutRate = combined.avgSelloutRate / venueCount;
        combined.avgTicketPrice = combined.avgTicketPrice / venueCount;
        
        // Average the trend data for rate-based metrics
        combined.trends.avgSelloutRate = combined.trends.avgSelloutRate.map(point => ({
          value: point.value / venueCount,
          date: point.date,
          formattedDate: point.formattedDate
        }));
        combined.trends.avgTicketPrice = combined.trends.avgTicketPrice.map(point => ({
          value: point.value / venueCount,
          date: point.date,
          formattedDate: point.formattedDate
        }));
        
        // Average the monthly percentage sold data
        combined.monthlyPercentageSold = combined.monthlyPercentageSold.map(monthData => ({
          month: monthData.month,
          percentage: Math.round(monthData.percentage / venueCount)
        }));
        
        // Average the quarterly percentage sold data
        combined.quarterlyPercentageSold = combined.quarterlyPercentageSold.map(quarterData => ({
          quarter: quarterData.quarter,
          percentage: Math.round(quarterData.percentage / venueCount)
        }));
        
        // Average the yearly percentage sold data
        combined.yearlyPercentageSold = combined.yearlyPercentageSold.map(yearData => ({
          year: yearData.year,
          percentage: Math.round(yearData.percentage / venueCount)
        }));
        
        // Average the genre breakdown data
        combined.monthlyGenreBreakdown = combined.monthlyGenreBreakdown.map(monthData => ({
          month: monthData.month,
          genres: monthData.genres.map(genreData => ({
            genre: genreData.genre,
            percentage: Math.round(genreData.percentage / venueCount)
          }))
        }));
        
        combined.quarterlyGenreBreakdown = combined.quarterlyGenreBreakdown.map(quarterData => ({
          quarter: quarterData.quarter,
          genres: quarterData.genres.map(genreData => ({
            genre: genreData.genre,
            percentage: Math.round(genreData.percentage / venueCount)
          }))
        }));
        
        combined.yearlyGenreBreakdown = combined.yearlyGenreBreakdown.map(yearData => ({
          year: yearData.year,
          genres: yearData.genres.map(genreData => ({
            genre: genreData.genre,
            percentage: Math.round(genreData.percentage / venueCount)
          }))
        }));
      }

      return combined;
    } catch (error) {
      console.error('Error in getUserVenuesAnalytics:', error);
      return this.getDefaultAnalytics('YTD');
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

  // Calculate monthly percentage sold for the past 12 months
  private static calculateMonthlyPercentageSold(events: any[]): Array<{ month: string; percentage: number }> {
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    // Generate 12 month periods (current year)
    const monthlyData = months.map((monthName, index) => {
      const monthStart = new Date(now.getFullYear(), index, 1);
      const monthEnd = new Date(now.getFullYear(), index + 1, 0);
      
      const monthEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });

      let totalTicketsSold = 0;
      let totalTicketsAvailable = 0;

      monthEvents.forEach(event => {
        const ticketsSold = event.tickets_sold || 0;
        const totalTickets = event.total_tickets || 0;
        totalTicketsSold += ticketsSold;
        totalTicketsAvailable += totalTickets;
      });

      const percentage = totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0;

      return {
        month: monthName,
        percentage: Math.round(percentage)
      };
    });

    return monthlyData;
  }

  // Calculate quarterly percentage sold for the current year
  private static calculateQuarterlyPercentageSold(events: any[]): Array<{ quarter: string; percentage: number }> {
    const now = new Date();
    const quarters = [
      { quarter: 'Q1', months: [0, 1, 2], label: 'Q1' },
      { quarter: 'Q2', months: [3, 4, 5], label: 'Q2' },
      { quarter: 'Q3', months: [6, 7, 8], label: 'Q3' },
      { quarter: 'Q4', months: [9, 10, 11], label: 'Q4' }
    ];

    const quarterlyData = quarters.map(q => {
      let totalTicketsSold = 0;
      let totalTicketsAvailable = 0;

      q.months.forEach(monthIndex => {
        const monthStart = new Date(now.getFullYear(), monthIndex, 1);
        const monthEnd = new Date(now.getFullYear(), monthIndex + 1, 0);
        
        const monthEvents = events.filter(event => {
          const eventDate = parseEventDate(event.date);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });

        monthEvents.forEach(event => {
          const ticketsSold = event.tickets_sold || 0;
          const totalTickets = event.total_tickets || 0;
          totalTicketsSold += ticketsSold;
          totalTicketsAvailable += totalTickets;
        });
      });

      const percentage = totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0;

      return {
        quarter: q.label,
        percentage: Math.round(percentage)
      };
    });

    return quarterlyData;
  }

  // Calculate yearly percentage sold for the last 5 years
  private static calculateYearlyPercentageSold(events: any[]): Array<{ year: string; percentage: number }> {
    const now = new Date();
    const years = [];
    
    // Generate last 5 years including current year
    for (let i = 4; i >= 0; i--) {
      years.push(now.getFullYear() - i);
    }

    const yearlyData = years.map(year => {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      
      const yearEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate >= yearStart && eventDate <= yearEnd;
      });

      let totalTicketsSold = 0;
      let totalTicketsAvailable = 0;

      yearEvents.forEach(event => {
        const ticketsSold = event.tickets_sold || 0;
        const totalTickets = event.total_tickets || 0;
        totalTicketsSold += ticketsSold;
        totalTicketsAvailable += totalTickets;
      });

      const percentage = totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0;

      return {
        year: year.toString(),
        percentage: Math.round(percentage)
      };
    });

    return yearlyData;
  }

  // Calculate monthly revenue for the current year
  private static calculateMonthlyRevenue(events: any[]): Array<{ month: string; revenue: number }> {
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    return months.map((monthName, index) => {
      const monthStart = new Date(now.getFullYear(), index, 1);
      const monthEnd = new Date(now.getFullYear(), index + 1, 0);
      
      const monthEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });

      const totalRevenue = monthEvents.reduce((sum, event) => {
        const ticketsSold = event.tickets_sold || 0;
        let ticketPrice = event.ticket_price || 0;
        
        // If no single ticket price, use average of min/max range
        if (!ticketPrice && event.ticket_price_min && event.ticket_price_max) {
          ticketPrice = (event.ticket_price_min + event.ticket_price_max) / 2;
        } else if (!ticketPrice && event.ticket_price_min) {
          ticketPrice = event.ticket_price_min;
        }
        
        const ticketRevenue = ticketsSold * ticketPrice;
        const barSales = event.bar_sales || 0;
        return sum + ticketRevenue + barSales;
      }, 0);

      return {
        month: monthName,
        revenue: Math.round(totalRevenue)
      };
    });
  }

  // Calculate quarterly revenue for the current year
  private static calculateQuarterlyRevenue(events: any[]): Array<{ quarter: string; revenue: number }> {
    const now = new Date();
    const quarters = [
      { quarter: 'Q1', months: [0, 1, 2] },
      { quarter: 'Q2', months: [3, 4, 5] },
      { quarter: 'Q3', months: [6, 7, 8] },
      { quarter: 'Q4', months: [9, 10, 11] }
    ];

    return quarters.map(q => {
      let totalRevenue = 0;

      q.months.forEach(monthIndex => {
        const monthStart = new Date(now.getFullYear(), monthIndex, 1);
        const monthEnd = new Date(now.getFullYear(), monthIndex + 1, 0);
        
        const monthEvents = events.filter(event => {
          const eventDate = parseEventDate(event.date);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });

        totalRevenue += monthEvents.reduce((sum, event) => {
          const ticketsSold = event.tickets_sold || 0;
          let ticketPrice = event.ticket_price || 0;
          
          // If no single ticket price, use average of min/max range
          if (!ticketPrice && event.ticket_price_min && event.ticket_price_max) {
            ticketPrice = (event.ticket_price_min + event.ticket_price_max) / 2;
          } else if (!ticketPrice && event.ticket_price_min) {
            ticketPrice = event.ticket_price_min;
          }
          
          const ticketRevenue = ticketsSold * ticketPrice;
          const barSales = event.bar_sales || 0;
          return sum + ticketRevenue + barSales;
        }, 0);
      });

      return {
        quarter: q.quarter,
        revenue: Math.round(totalRevenue)
      };
    });
  }

  // Calculate yearly revenue for the last 5 years
  private static calculateYearlyRevenue(events: any[]): Array<{ year: string; revenue: number }> {
    const now = new Date();
    const years = [];
    
    // Generate last 5 years including current year
    for (let i = 4; i >= 0; i--) {
      years.push(now.getFullYear() - i);
    }

    return years.map(year => {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      
      const yearEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate >= yearStart && eventDate <= yearEnd;
      });

      const totalRevenue = yearEvents.reduce((sum, event) => {
        const ticketsSold = event.tickets_sold || 0;
        let ticketPrice = event.ticket_price || 0;
        
        // If no single ticket price, use average of min/max range
        if (!ticketPrice && event.ticket_price_min && event.ticket_price_max) {
          ticketPrice = (event.ticket_price_min + event.ticket_price_max) / 2;
        } else if (!ticketPrice && event.ticket_price_min) {
          ticketPrice = event.ticket_price_min;
        }
        
        const ticketRevenue = ticketsSold * ticketPrice;
        const barSales = event.bar_sales || 0;
        return sum + ticketRevenue + barSales;
      }, 0);

      return {
        year: year.toString(),
        revenue: Math.round(totalRevenue)
      };
    });
  }

  // Extract unique genres from all events
  private static extractGenresFromEvents(events: any[]): string[] {
    const genreSet = new Set<string>();
    
    events.forEach(event => {
      event.event_artists?.forEach((ea: any) => {
        if (ea.artists?.genre) {
          genreSet.add(ea.artists.genre.toUpperCase().trim());
        }
      });
    });
    
    return Array.from(genreSet).sort();
  }

  // Combine genre breakdown data from multiple venues
  private static combineGenreBreakdown<T extends { month?: string; quarter?: string; year?: string; genres: Array<{ genre: string; percentage: number }> }>(
    acc: T[],
    current: T[]
  ): T[] {
    return acc.map((accPeriod, index) => {
      const currentPeriod = current[index];
      if (!currentPeriod) return accPeriod;

      // Get all unique genres from both accumulator and current
      const allGenres = new Set<string>();
      accPeriod.genres.forEach(g => allGenres.add(g.genre));
      currentPeriod.genres.forEach(g => allGenres.add(g.genre));

      // Combine percentages for each genre
      const combinedGenres = Array.from(allGenres).map(genre => {
        const accGenre = accPeriod.genres.find(g => g.genre === genre);
        const currentGenre = currentPeriod.genres.find(g => g.genre === genre);
        
        return {
          genre,
          percentage: (accGenre?.percentage || 0) + (currentGenre?.percentage || 0)
        };
      }).sort((a, b) => a.genre.localeCompare(b.genre));

      return {
        ...accPeriod,
        genres: combinedGenres
      };
    });
  }

  // Combine genre revenue data from multiple venues
  private static combineGenreRevenue<T extends { month?: string; quarter?: string; year?: string; genres: Array<{ genre: string; revenue: number }> }>(
    acc: T[],
    current: T[]
  ): T[] {
    return acc.map((accPeriod, index) => {
      const currentPeriod = current[index];
      if (!currentPeriod) return accPeriod;

      // Get all unique genres from both accumulator and current
      const allGenres = new Set<string>();
      accPeriod.genres.forEach(g => allGenres.add(g.genre));
      currentPeriod.genres.forEach(g => allGenres.add(g.genre));

      // Combine revenue for each genre
      const combinedGenres = Array.from(allGenres).map(genre => {
        const accGenre = accPeriod.genres.find(g => g.genre === genre);
        const currentGenre = currentPeriod.genres.find(g => g.genre === genre);
        
        return {
          genre,
          revenue: (accGenre?.revenue || 0) + (currentGenre?.revenue || 0)
        };
      }).sort((a, b) => a.genre.localeCompare(b.genre));

      return {
        ...accPeriod,
        genres: combinedGenres
      };
    });
  }

  // Calculate monthly genre breakdown for the current year
  private static calculateMonthlyGenreBreakdown(events: any[]): Array<{ month: string; genres: Array<{ genre: string; percentage: number }> }> {
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const venueGenres = this.extractGenresFromEvents(events);

    return months.map((monthName, index) => {
      const monthStart = new Date(now.getFullYear(), index, 1);
      const monthEnd = new Date(now.getFullYear(), index + 1, 0);
      
      const monthEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });

      // Calculate percentage for each genre
      const genreData = venueGenres.map(genre => {
        const genreEvents = monthEvents.filter(event => 
          event.event_artists?.some((ea: any) => 
            ea.artists?.genre?.toUpperCase().trim() === genre
          )
        );

        let totalTicketsSold = 0;
        let totalTicketsAvailable = 0;

        genreEvents.forEach(event => {
          const ticketsSold = event.tickets_sold || 0;
          const totalTickets = event.total_tickets || 0;
          totalTicketsSold += ticketsSold;
          totalTicketsAvailable += totalTickets;
        });

        const percentage = totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0;

        return {
          genre: genre,
          percentage: Math.round(percentage)
        };
      });

      return {
        month: monthName,
        genres: genreData
      };
    });
  }

  // Calculate quarterly genre breakdown for the current year
  private static calculateQuarterlyGenreBreakdown(events: any[]): Array<{ quarter: string; genres: Array<{ genre: string; percentage: number }> }> {
    const now = new Date();
    const quarters = [
      { quarter: 'Q1', months: [0, 1, 2] },
      { quarter: 'Q2', months: [3, 4, 5] },
      { quarter: 'Q3', months: [6, 7, 8] },
      { quarter: 'Q4', months: [9, 10, 11] }
    ];
    const venueGenres = this.extractGenresFromEvents(events);

    return quarters.map(q => {
      // Get all events for this quarter
      const quarterEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return q.months.some(monthIndex => {
          const monthStart = new Date(now.getFullYear(), monthIndex, 1);
          const monthEnd = new Date(now.getFullYear(), monthIndex + 1, 0);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });
      });

      // Calculate percentage for each genre
      const genreData = venueGenres.map(genre => {
        const genreEvents = quarterEvents.filter(event => 
          event.event_artists?.some((ea: any) => 
            ea.artists?.genre?.toUpperCase().trim() === genre
          )
        );

        let totalTicketsSold = 0;
        let totalTicketsAvailable = 0;

        genreEvents.forEach(event => {
          const ticketsSold = event.tickets_sold || 0;
          const totalTickets = event.total_tickets || 0;
          totalTicketsSold += ticketsSold;
          totalTicketsAvailable += totalTickets;
        });

        const percentage = totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0;

        return {
          genre: genre,
          percentage: Math.round(percentage)
        };
      });

      return {
        quarter: q.quarter,
        genres: genreData
      };
    });
  }

  // Calculate yearly genre breakdown for the last 5 years
  private static calculateYearlyGenreBreakdown(events: any[]): Array<{ year: string; genres: Array<{ genre: string; percentage: number }> }> {
    const now = new Date();
    const years = [];
    const venueGenres = this.extractGenresFromEvents(events);
    
    // Generate last 5 years including current year
    for (let i = 4; i >= 0; i--) {
      years.push(now.getFullYear() - i);
    }

    return years.map(year => {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      
      const yearEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate >= yearStart && eventDate <= yearEnd;
      });

      // Calculate percentage for each genre
      const genreData = venueGenres.map(genre => {
        const genreEvents = yearEvents.filter(event => 
          event.event_artists?.some((ea: any) => 
            ea.artists?.genre?.toUpperCase().trim() === genre
          )
        );

        let totalTicketsSold = 0;
        let totalTicketsAvailable = 0;

        genreEvents.forEach(event => {
          const ticketsSold = event.tickets_sold || 0;
          const totalTickets = event.total_tickets || 0;
          totalTicketsSold += ticketsSold;
          totalTicketsAvailable += totalTickets;
        });

        const percentage = totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0;

        return {
          genre: genre,
          percentage: Math.round(percentage)
        };
      });

      return {
        year: year.toString(),
        genres: genreData
      };
    });
  }

  // Calculate monthly genre revenue breakdown for the current year
  private static calculateMonthlyGenreRevenue(events: any[]): Array<{ month: string; genres: Array<{ genre: string; revenue: number }> }> {
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const venueGenres = this.extractGenresFromEvents(events);

    return months.map((monthName, index) => {
      const monthStart = new Date(now.getFullYear(), index, 1);
      const monthEnd = new Date(now.getFullYear(), index + 1, 0);
      
      const monthEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });

      // Calculate revenue for each genre
      const genreData = venueGenres.map(genre => {
        const genreEvents = monthEvents.filter(event => 
          event.event_artists?.some((ea: any) => 
            ea.artists?.genre?.toUpperCase().trim() === genre
          )
        );

        let totalRevenue = 0;

        genreEvents.forEach(event => {
          const ticketsSold = event.tickets_sold || 0;
          let ticketPrice = event.ticket_price || 0;
          
          // Handle price ranges
          if (!ticketPrice && event.ticket_price_min && event.ticket_price_max) {
            ticketPrice = (event.ticket_price_min + event.ticket_price_max) / 2;
          } else if (!ticketPrice && event.ticket_price_min) {
            ticketPrice = event.ticket_price_min;
          }
          
          const ticketRevenue = ticketsSold * ticketPrice;
          const barSales = event.bar_sales || 0;
          totalRevenue += ticketRevenue + barSales;
        });

        return {
          genre: genre,
          revenue: Math.round(totalRevenue)
        };
      });

      return {
        month: monthName,
        genres: genreData
      };
    });
  }

  // Calculate quarterly genre revenue breakdown for the current year
  private static calculateQuarterlyGenreRevenue(events: any[]): Array<{ quarter: string; genres: Array<{ genre: string; revenue: number }> }> {
    const now = new Date();
    const quarters = [
      { quarter: 'Q1', months: [0, 1, 2] },
      { quarter: 'Q2', months: [3, 4, 5] },
      { quarter: 'Q3', months: [6, 7, 8] },
      { quarter: 'Q4', months: [9, 10, 11] }
    ];
    const venueGenres = this.extractGenresFromEvents(events);

    return quarters.map(q => {
      // Get all events for this quarter
      const quarterEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return q.months.some(monthIndex => {
          const monthStart = new Date(now.getFullYear(), monthIndex, 1);
          const monthEnd = new Date(now.getFullYear(), monthIndex + 1, 0);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });
      });

      // Calculate revenue for each genre
      const genreData = venueGenres.map(genre => {
        const genreEvents = quarterEvents.filter(event => 
          event.event_artists?.some((ea: any) => 
            ea.artists?.genre?.toUpperCase().trim() === genre
          )
        );

        let totalRevenue = 0;

        genreEvents.forEach(event => {
          const ticketsSold = event.tickets_sold || 0;
          let ticketPrice = event.ticket_price || 0;
          
          // Handle price ranges
          if (!ticketPrice && event.ticket_price_min && event.ticket_price_max) {
            ticketPrice = (event.ticket_price_min + event.ticket_price_max) / 2;
          } else if (!ticketPrice && event.ticket_price_min) {
            ticketPrice = event.ticket_price_min;
          }
          
          const ticketRevenue = ticketsSold * ticketPrice;
          const barSales = event.bar_sales || 0;
          totalRevenue += ticketRevenue + barSales;
        });

        return {
          genre: genre,
          revenue: Math.round(totalRevenue)
        };
      });

      return {
        quarter: q.quarter,
        genres: genreData
      };
    });
  }

  // Calculate yearly genre revenue breakdown for the last 5 years
  private static calculateYearlyGenreRevenue(events: any[]): Array<{ year: string; genres: Array<{ genre: string; revenue: number }> }> {
    const now = new Date();
    const years = [];
    const venueGenres = this.extractGenresFromEvents(events);
    
    // Generate last 5 years including current year
    for (let i = 4; i >= 0; i--) {
      years.push(now.getFullYear() - i);
    }

    return years.map(year => {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      
      const yearEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate >= yearStart && eventDate <= yearEnd;
      });

      // Calculate revenue for each genre
      const genreData = venueGenres.map(genre => {
        const genreEvents = yearEvents.filter(event => 
          event.event_artists?.some((ea: any) => 
            ea.artists?.genre?.toUpperCase().trim() === genre
          )
        );

        let totalRevenue = 0;

        genreEvents.forEach(event => {
          const ticketsSold = event.tickets_sold || 0;
          let ticketPrice = event.ticket_price || 0;
          
          // Handle price ranges
          if (!ticketPrice && event.ticket_price_min && event.ticket_price_max) {
            ticketPrice = (event.ticket_price_min + event.ticket_price_max) / 2;
          } else if (!ticketPrice && event.ticket_price_min) {
            ticketPrice = event.ticket_price_min;
          }
          
          const ticketRevenue = ticketsSold * ticketPrice;
          const barSales = event.bar_sales || 0;
          totalRevenue += ticketRevenue + barSales;
        });

        return {
          genre: genre,
          revenue: Math.round(totalRevenue)
        };
      });

      return {
        year: year.toString(),
        genres: genreData
      };
    });
  }

  // Calculate trends for analytics metrics
  private static calculateTrends(events: any[], timeFrame: 'YTD' | 'MTD' | 'ALL' = 'YTD'): VenueAnalytics['trends'] {
    const now = new Date();
    const periods: Date[] = [];
    
    // Generate periods based on timeframe
    if (timeFrame === 'MTD') {
      // For MTD, show daily trends for current month
      const today = now.getDate();
      const maxDays = Math.min(today, 7); // Show max 7 days or current day
      
      for (let i = maxDays - 1; i >= 0; i--) {
        const dayNumber = today - i;
        if (dayNumber >= 1) { // Only include days within current month
          const periodDate = new Date(now.getFullYear(), now.getMonth(), dayNumber);
          periods.push(periodDate);
        }
      }
    } else if (timeFrame === 'YTD') {
      // For YTD, show monthly trends for current year
      const currentMonth = now.getMonth();
      const maxMonths = Math.min(currentMonth + 1, 6); // Show max 6 months or current month
      
      for (let i = maxMonths - 1; i >= 0; i--) {
        const periodDate = new Date(now.getFullYear(), currentMonth - i, 1);
        periods.push(periodDate);
      }
    } else {
      // For ALL, show last 6 months
      for (let i = 5; i >= 0; i--) {
        const periodDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periods.push(periodDate);
      }
    }

    const periodData = periods.map(period => {
      let periodEnd: Date;
      let periodEvents: any[];
      
      if (timeFrame === 'MTD') {
        // For daily periods, use same day
        periodEnd = new Date(period.getFullYear(), period.getMonth(), period.getDate(), 23, 59, 59);
        periodEvents = events.filter(event => {
          const eventDate = parseEventDate(event.date);
          const eventDay = eventDate.toDateString();
          const periodDay = period.toDateString();
          return eventDay === periodDay;
        });
      } else {
        // For monthly periods, use end of month
        periodEnd = new Date(period.getFullYear(), period.getMonth() + 1, 0);
        periodEvents = events.filter(event => {
          const eventDate = parseEventDate(event.date);
          return eventDate >= period && eventDate <= periodEnd;
        });
      }

      let totalTicketSales = 0;
      let totalBarSales = 0;
      let totalTicketsSold = 0;
      let totalTicketsAvailable = 0;
      let totalTicketRevenue = 0;

      periodEvents.forEach(event => {
        const ticketsSold = event.tickets_sold || 0;
        const ticketRevenue = event.total_ticket_revenue || 0;
        const barSales = event.bar_sales || 0;
        const totalTickets = event.total_tickets || 0;

        totalTicketsSold += ticketsSold;
        totalTicketsAvailable += totalTickets;
        totalTicketRevenue += ticketRevenue;
        totalBarSales += barSales;
        totalTicketSales += ticketRevenue;
      });

      const avgSelloutRate = totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0;
      const avgTicketPrice = totalTicketsSold > 0 ? totalTicketRevenue / totalTicketsSold : 0;

      // Format the period date for display based on timeframe
      const date = period.toISOString();
      let formattedDate: string;
      
      if (timeFrame === 'MTD') {
        formattedDate = period.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      } else {
        formattedDate = period.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
      }

      return {
        date,
        formattedDate,
        showsReported: periodEvents.length,
        ticketSales: totalTicketSales,
        barSales: totalBarSales,
        avgSelloutRate,
        avgTicketPrice
      };
    });

    return {
      showsReported: periodData.map(p => ({ value: p.showsReported, date: p.date, formattedDate: p.formattedDate })),
      ticketSales: periodData.map(p => ({ value: p.ticketSales, date: p.date, formattedDate: p.formattedDate })),
      barSales: periodData.map(p => ({ value: p.barSales, date: p.date, formattedDate: p.formattedDate })),
      avgSelloutRate: periodData.map(p => ({ value: p.avgSelloutRate, date: p.date, formattedDate: p.formattedDate })),
      avgTicketPrice: periodData.map(p => ({ value: p.avgTicketPrice, date: p.date, formattedDate: p.formattedDate }))
    };
  }

  // Default analytics for empty state
  public static getDefaultAnalytics(timeFrame: 'YTD' | 'MTD' | 'ALL' = 'YTD'): VenueAnalytics {
    const now = new Date();
    let emptyTrend: { value: number; date: string; formattedDate: string }[];

    if (timeFrame === 'MTD') {
      // For MTD, create daily trends
      const today = now.getDate();
      const maxDays = Math.min(today, 7);
      emptyTrend = Array.from({ length: maxDays }, (_, i) => {
        const dayNumber = today - (maxDays - 1 - i);
        const date = new Date(now.getFullYear(), now.getMonth(), dayNumber);
        return {
          value: 0,
          date: date.toISOString(),
          formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
    } else {
      // For YTD and ALL, create monthly trends
      emptyTrend = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          value: 0,
          date: date.toISOString(),
          formattedDate: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
      });
    }
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const emptyMonthlyData = months.map(month => ({ month, percentage: 0 }));
    
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const emptyQuarterlyData = quarters.map(quarter => ({ quarter, percentage: 0 }));
    
    const years = [];
    for (let i = 4; i >= 0; i--) {
      years.push((now.getFullYear() - i).toString());
    }
    const emptyYearlyData = years.map(year => ({ year, percentage: 0 }));
    
    return {
      showsReported: 0,
      ticketSales: 0,
      barSales: 0,
      avgSelloutRate: 0,
      avgTicketPrice: 0,
      topMonth: { month: 'N/A', count: 0, avgPercentageSold: 0 },
      topGenre: { genre: 'N/A', count: 0, avgPercentageSold: 0 },
      topArtist: { name: 'N/A', count: 0, avgPercentageSold: 0 },
      trends: {
        showsReported: emptyTrend,
        ticketSales: emptyTrend,
        barSales: emptyTrend,
        avgSelloutRate: emptyTrend,
        avgTicketPrice: emptyTrend
      },
      monthlyPercentageSold: emptyMonthlyData,
      quarterlyPercentageSold: emptyQuarterlyData,
      yearlyPercentageSold: emptyYearlyData,
      monthlyRevenue: months.map(month => ({ month, revenue: 0 })),
      quarterlyRevenue: quarters.map(quarter => ({ quarter, revenue: 0 })),
      yearlyRevenue: years.map(year => ({ year, revenue: 0 })),
      monthlyGenreBreakdown: months.map(month => ({
        month,
        genres: [] // Empty when no events exist
      })),
      quarterlyGenreBreakdown: quarters.map(quarter => ({
        quarter,
        genres: [] // Empty when no events exist
      })),
      yearlyGenreBreakdown: years.map(year => ({
        year,
        genres: [] // Empty when no events exist
      })),
      monthlyGenreRevenue: months.map(month => ({
        month,
        genres: [] // Empty when no events exist
      })),
      quarterlyGenreRevenue: quarters.map(quarter => ({
        quarter,
        genres: [] // Empty when no events exist
      })),
      yearlyGenreRevenue: years.map(year => ({
        year,
        genres: [] // Empty when no events exist
      }))
    };
  }

  /**
   * Get booking intelligence data for a venue
   * 
   * This method calculates average social media metrics for all artists
   * that have performed at the venue, using historical data from around
   * each artist's booking date.
   * 
   * @param params - Parameters including venueId and filters
   * @returns Promise<BookingIntelligenceResult> - The calculated intelligence data
   */
  static async getBookingIntelligence(params: GetBookingIntelligenceParams): Promise<BookingIntelligenceResult> {
    const { venueId, filters } = params;
    
    try {
      console.log('VenueService.getBookingIntelligence: Starting calculation for venue:', venueId);
      
      // 1. Get venue information
      const venue = await this.getVenueById(venueId);
      if (!venue) {
        return {
          data: null,
          error: {
            code: 'NO_VENUE',
            message: 'Venue not found',
            details: { venueId }
          },
          success: false
        };
      }

      // 2. Get venue events with applied filters
      const artistDataPoints = await this.getArtistBookingDataPoints(venueId, filters);
      
      if (artistDataPoints.length === 0) {
        return {
          data: null,
          error: {
            code: 'NO_EVENTS',
            message: 'No events found for this venue with the applied filters',
            details: { venueId, filters }
          },
          success: false
        };
      }

      // 3. Calculate averages from the data points
      const metrics = this.calculateAverageMetrics(artistDataPoints);
      
      // 4. Build date range from events
      const dates = artistDataPoints.map(dp => dp.bookingDate).sort();
      const dateRange = dates.length > 0 ? {
        from: dates[0],
        to: dates[dates.length - 1]
      } : null;

      // 5. Count unique artists and total events
      const uniqueArtists = new Set(artistDataPoints.map(dp => dp.artistId));
      
      const result: BookingIntelligenceData = {
        metrics,
        artistCount: uniqueArtists.size,
        eventCount: artistDataPoints.length,
        dateRange,
        venue: {
          id: venue.id,
          name: venue.name,
          city: venue.location || 'Unknown'
        },
        lastUpdated: new Date().toISOString(),
        appliedFilters: filters
      };
      
      console.log('VenueService.getBookingIntelligence: Calculation completed', {
        artistCount: result.artistCount,
        eventCount: result.eventCount,
        venueId
      });
      
      return {
        data: result,
        error: null,
        success: true
      };
      
    } catch (error) {
      console.error('VenueService.getBookingIntelligence: Error:', error);
      
      return {
        data: null,
        error: {
          code: 'API_ERROR',
          message: 'Failed to calculate booking intelligence',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        success: false
      };
    }
  }

  /**
   * Get artist booking data points for intelligence calculation
   * 
   * This helper method retrieves all artists who performed at a venue
   * with their booking dates and performance details.
   * 
   * @param venueId - The venue ID
   * @param filters - Filters to apply to events
   * @returns Promise<any[]> - Array of artist data points (to be typed in Phase 5)
   */
  private static async getArtistBookingDataPoints(
    venueId: string, 
    filters: BookingIntelligenceFilters
  ): Promise<ArtistBookingDataPoint[]> {
    try {
      console.log('VenueService.getArtistBookingDataPoints: Fetching events for venue:', venueId);
      
      // 1. Build date filter based on timeframe
      let dateFilter = '';
      const now = new Date();
      
      switch (filters.timeFrame) {
        case 'month': {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          dateFilter = oneMonthAgo.toISOString().split('T')[0];
          break;
        }
        case '3months': {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          dateFilter = threeMonthsAgo.toISOString().split('T')[0];
          break;
        }
        case '6months': {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(now.getMonth() - 6);
          dateFilter = sixMonthsAgo.toISOString().split('T')[0];
          break;
        }
        case '12months': {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          dateFilter = oneYearAgo.toISOString().split('T')[0];
          break;
        }
        case 'all':
        default:
          dateFilter = '2000-01-01'; // Far back date to include all events
          break;
      }

      // 2. Query events with artist information
      const query = supabase
        .from('events')
        .select(`
          id,
          name,
          date,
          total_tickets,
          tickets_sold,
          event_artists (
            artist_id,
            is_headliner,
            performance_order,
            artists (
              id,
              name,
              genre
            )
          )
        `)
        .eq('venue_id', venueId)
        .gte('date', dateFilter)
        .order('date', { ascending: false });

      const { data: events, error } = await query;

      if (error) {
        console.error('VenueService.getArtistBookingDataPoints: Database error:', error);
        throw error;
      }

      if (!events || events.length === 0) {
        console.log('VenueService.getArtistBookingDataPoints: No events found for venue');
        return [];
      }

      console.log(`VenueService.getArtistBookingDataPoints: Found ${events.length} events with filters:`, filters);

      // 3. Process events and extract artist data points
      const dataPoints: ArtistBookingDataPoint[] = [];
      let filteredOutByPercentage = 0;
      let filteredOutByGenre = 0;

      for (const event of events) {
        // Calculate percentage sold
        const percentageSold = event.total_tickets > 0 
          ? ((event.tickets_sold || 0) / event.total_tickets) * 100 
          : 0;

        console.log(`📊 Event Debug: "${event.name}" (${event.date})`, {
          totalTickets: event.total_tickets,
          ticketsSold: event.tickets_sold,
          percentageSold: percentageSold.toFixed(1) + '%',
          filterRange: `${filters.percentSoldRange[0]}-${filters.percentSoldRange[1]}%`
        });

        // Apply percentage sold filter
        const [minPercent, maxPercent] = filters.percentSoldRange;
        if (percentageSold < minPercent || percentageSold > maxPercent) {
          console.log(`❌ Event "${event.name}" filtered out by percentage: ${percentageSold.toFixed(1)}% not in range ${minPercent}-${maxPercent}%`);
          filteredOutByPercentage++;
          continue;
        }

        console.log(`✅ Event "${event.name}" passed percentage filter: ${percentageSold.toFixed(1)}% is in range ${minPercent}-${maxPercent}%`);

        // Process each artist in the event
        if (event.event_artists && event.event_artists.length > 0) {
          for (const eventArtist of event.event_artists) {
            if (!(eventArtist as any).artists) continue;

            const artist = (eventArtist as any).artists;

            // Apply genre filter
            if (filters.genres.length > 0 && artist.genre) {
              if (!filters.genres.includes(artist.genre)) {
                filteredOutByGenre++;
                continue;
              }
            }

            // Create data point and fetch real social metrics from VibrateService
            const dataPoint: ArtistBookingDataPoint = {
              artistId: artist.id,
              artistName: artist.name,
              eventId: event.id,
              bookingDate: event.date,
              genre: artist.genre,
              percentageSold,
              socialMetrics: {
                spotifyFollowers: null, // Will be populated below
                youtubeSubscribers: null,
                instagramFollowers: null,
                tiktokFollowers: null,
                spotifyListenersLocal: null
              },
              isHeadliner: eventArtist.is_headliner || false
            };

            dataPoints.push(dataPoint);
          }
        }
      }

      console.log(`VenueService.getArtistBookingDataPoints: Filter Results:`, {
        totalEvents: events.length,
        filteredOutByPercentage,
        filteredOutByGenre,
        finalArtistDataPoints: dataPoints.length,
        appliedFilters: filters
      });
      
      // 4. Fetch real social media data for each artist around their booking date
      console.log('VenueService.getArtistBookingDataPoints: Fetching real social media data...');
      const dataPointsWithSocialData = await this.fetchHistoricalSocialMetrics(dataPoints);
      
      console.log(`VenueService.getArtistBookingDataPoints: Completed with ${dataPointsWithSocialData.length} data points with social metrics`);
      return dataPointsWithSocialData;

    } catch (error) {
      console.error('VenueService.getArtistBookingDataPoints: Error:', error);
      throw error;
    }
  }

  /**
   * Get all unique genres from events at a venue
   * 
   * @param venueId - The venue ID
   * @returns Promise<string[]> - Array of unique genre names
   */
  static async getVenueGenres(venueId: string): Promise<string[]> {
    try {
      console.log('VenueService.getVenueGenres: Fetching genres for venue:', venueId);
      
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          event_artists (
            artists (
              genre
            )
          )
        `)
        .eq('venue_id', venueId);

      if (error) {
        console.error('VenueService.getVenueGenres: Database error:', error);
        return [];
      }

      if (!events || events.length === 0) {
        console.log('VenueService.getVenueGenres: No events found for venue');
        return [];
      }

      // Extract unique genres
      const genres = new Set<string>();
      
      for (const event of events) {
        if (event.event_artists && event.event_artists.length > 0) {
          for (const eventArtist of event.event_artists) {
            if ((eventArtist as any).artists?.genre) {
              genres.add((eventArtist as any).artists.genre);
            }
          }
        }
      }

      const uniqueGenres = Array.from(genres).sort();
      console.log(`VenueService.getVenueGenres: Found ${uniqueGenres.length} unique genres:`, uniqueGenres);
      
      return uniqueGenres;
    } catch (error) {
      console.error('VenueService.getVenueGenres: Error:', error);
      return [];
    }
  }

  /**
   * Fetch historical social media metrics for artists around their booking dates
   * 
   * This method takes artist data points and fetches real social media data 
   * from VibrateService for the time period around each artist's booking date.
   * 
   * @param dataPoints - Array of artist booking data points
   * @returns Promise<ArtistBookingDataPoint[]> - Data points with populated social metrics
   */
  private static async fetchHistoricalSocialMetrics(dataPoints: ArtistBookingDataPoint[]): Promise<ArtistBookingDataPoint[]> {
    const results: ArtistBookingDataPoint[] = [];
    
    for (const dataPoint of dataPoints) {
      try {
        console.log(`Fetching social data for artist: ${dataPoint.artistName} (booking date: ${dataPoint.bookingDate})`);
        
        // 1. Search for artist in Vibrate database
        const searchResults = await VibrateService.searchArtists(dataPoint.artistName);
        console.log(`Search results for "${dataPoint.artistName}":`, searchResults);
        
        if (!searchResults?.artists?.length) {
          console.log(`No Vibrate data found for artist: ${dataPoint.artistName}`);
          results.push(dataPoint); // Keep original data point with null social metrics
          continue;
        }

        // Log all found artists for debugging
        console.log(`Found ${searchResults.artists.length} artists for "${dataPoint.artistName}":`, 
          searchResults.artists.map(a => ({ name: a.name, uuid: a.uuid })));

        // For now, let's use the first result even if it's not an exact match
        // This helps with testing - in production you might want stricter matching
        const vibrateArtist = searchResults.artists[0];
        console.log(`Using best match: ${vibrateArtist.name} (UUID: ${vibrateArtist.uuid}) for search term "${dataPoint.artistName}"`);

        // 2. Calculate date range around booking date (±1 week to find closest data)
        const bookingDate = new Date(dataPoint.bookingDate);
        const dateFrom = new Date(bookingDate);
        dateFrom.setDate(bookingDate.getDate() - 7); // 1 week before
        const dateTo = new Date(bookingDate);
        dateTo.setDate(bookingDate.getDate() + 7); // 1 week after

        const dateFromStr = dateFrom.toISOString().split('T')[0];
        const dateToStr = dateTo.toISOString().split('T')[0];

        console.log(`Fetching social data for date range: ${dateFromStr} to ${dateToStr}`);

        // 3. Fetch historical social media data in parallel
        const [spotifyFanbase, instagramFanbase, tiktokFanbase, youtubeFanbase] = await Promise.allSettled([
          this.getHistoricalSpotifyFanbase(vibrateArtist.uuid, dateFromStr, dateToStr),
          this.getHistoricalInstagramFanbase(vibrateArtist.uuid, dateFromStr, dateToStr),
          this.getHistoricalTikTokFanbase(vibrateArtist.uuid, dateFromStr, dateToStr),
          this.getHistoricalYouTubeFanbase(vibrateArtist.uuid, dateFromStr, dateToStr)
        ]);

        // 4. Extract the closest data point to booking date
        const socialMetrics = {
          spotifyFollowers: this.extractClosestValue(spotifyFanbase, dataPoint.bookingDate),
          youtubeSubscribers: this.extractClosestValue(youtubeFanbase, dataPoint.bookingDate),
          instagramFollowers: this.extractClosestValue(instagramFanbase, dataPoint.bookingDate),
          tiktokFollowers: this.extractClosestValue(tiktokFanbase, dataPoint.bookingDate),
          spotifyListenersLocal: null // TODO: Implement local listeners logic
        };

        console.log(`Social metrics for ${dataPoint.artistName}:`, socialMetrics);

        // 5. Update data point with real social metrics
        results.push({
          ...dataPoint,
          socialMetrics
        });

      } catch (error) {
        console.error(`Error fetching social data for ${dataPoint.artistName}:`, error);
        results.push(dataPoint); // Keep original data point on error
      }
    }

    return results;
  }

  /**
   * Get historical Spotify fanbase data for specific date range
   */
  private static async getHistoricalSpotifyFanbase(artistUuid: string, dateFrom: string, dateTo: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-fanbase', {
        body: { artistUuid, dateFrom, dateTo }
      });

      if (error || !data?.success) {
        console.error('Error fetching historical Spotify fanbase:', error || data);
        return null;
      }

      return data.total || {};
    } catch (error) {
      console.error('Error in getHistoricalSpotifyFanbase:', error);
      return null;
    }
  }

  /**
   * Get historical Instagram fanbase data for specific date range
   */
  private static async getHistoricalInstagramFanbase(artistUuid: string, dateFrom: string, dateTo: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('instagram-fanbase', {
        body: { artistUuid, dateFrom, dateTo }
      });

      if (error || !data?.success) {
        console.error('Error fetching historical Instagram fanbase:', error || data);
        return null;
      }

      return data.total || {};
    } catch (error) {
      console.error('Error in getHistoricalInstagramFanbase:', error);
      return null;
    }
  }

  /**
   * Get historical TikTok fanbase data for specific date range
   */
  private static async getHistoricalTikTokFanbase(artistUuid: string, dateFrom: string, dateTo: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-fanbase', {
        body: { artistUuid, dateFrom, dateTo }
      });

      if (error || !data?.success) {
        console.error('Error fetching historical TikTok fanbase:', error || data);
        return null;
      }

      return data.tiktokFanbase?.data || {};
    } catch (error) {
      console.error('Error in getHistoricalTikTokFanbase:', error);
      return null;
    }
  }

  /**
   * Get historical YouTube fanbase data for specific date range
   */
  private static async getHistoricalYouTubeFanbase(artistUuid: string, dateFrom: string, dateTo: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('youtube-fanbase', {
        body: { artistUuid, dateFrom, dateTo }
      });

      if (error || !data?.success) {
        console.error('Error fetching historical YouTube fanbase:', error || data);
        return null;
      }

      return data.total || {};
    } catch (error) {
      console.error('Error in getHistoricalYouTubeFanbase:', error);
      return null;
    }
  }

  /**
   * Extract the value closest to the booking date from time-series data
   */
  private static extractClosestValue(promiseResult: PromiseSettledResult<any>, bookingDate: string): number | null {
    if (promiseResult.status === 'rejected' || !promiseResult.value) {
      return null;
    }

    const timeSeriesData = promiseResult.value;
    if (!timeSeriesData || typeof timeSeriesData !== 'object') {
      return null;
    }

    const bookingDateTime = new Date(bookingDate).getTime();
    let closestDate: string | null = null;
    let closestTimeDiff = Infinity;

    // Find the date closest to booking date
    for (const dateStr in timeSeriesData) {
      const dataPointTime = new Date(dateStr).getTime();
      const timeDiff = Math.abs(dataPointTime - bookingDateTime);
      
      if (timeDiff < closestTimeDiff) {
        closestTimeDiff = timeDiff;
        closestDate = dateStr;
      }
    }

    if (!closestDate) {
      return null;
    }

    const value = timeSeriesData[closestDate];
    console.log(`Closest data point for ${bookingDate}: ${closestDate} = ${value}`);
    
    return typeof value === 'number' ? value : null;
  }

  /**
   * Calculate average metrics from artist data points
   * 
   * @param dataPoints - Array of artist booking data points (to be typed in Phase 5)
   * @returns Calculated average metrics
   */
  private static calculateAverageMetrics(dataPoints: ArtistBookingDataPoint[]): BookingIntelligenceData['metrics'] {
    console.log(`VenueService.calculateAverageMetrics: Calculating averages for ${dataPoints.length} data points`);
    
    if (dataPoints.length === 0) {
      return {
        spotifyFollowers: 0,
        youtubeSubscribers: 0,
        instagramFollowers: 0,
        tiktokFollowers: 0,
        spotifyListenersLocal: 0,
        totalPerformances: 0,
        localPerformances: 0
      };
    }

    // Calculate averages from real social media data
    let spotifyTotal = 0;
    let youtubeTotal = 0;
    let instagramTotal = 0;
    let tiktokTotal = 0;
    let spotifyLocalTotal = 0;
    
    let spotifyCount = 0;
    let youtubeCount = 0;
    let instagramCount = 0;
    let tiktokCount = 0;
    let spotifyLocalCount = 0;

    // Sum up all available social metrics
    for (const dataPoint of dataPoints) {
      const { socialMetrics } = dataPoint;
      
      if (socialMetrics.spotifyFollowers !== null) {
        spotifyTotal += socialMetrics.spotifyFollowers;
        spotifyCount++;
      }
      
      if (socialMetrics.youtubeSubscribers !== null) {
        youtubeTotal += socialMetrics.youtubeSubscribers;
        youtubeCount++;
      }
      
      if (socialMetrics.instagramFollowers !== null) {
        instagramTotal += socialMetrics.instagramFollowers;
        instagramCount++;
      }
      
      if (socialMetrics.tiktokFollowers !== null) {
        tiktokTotal += socialMetrics.tiktokFollowers;
        tiktokCount++;
      }
      
      if (socialMetrics.spotifyListenersLocal !== null) {
        spotifyLocalTotal += socialMetrics.spotifyListenersLocal;
        spotifyLocalCount++;
      }
    }

    // Calculate performance metrics
    const totalPerformances = dataPoints.length;
    const localPerformances = Math.floor(totalPerformances * 0.6); // Assume 60% are local

    const result = {
      spotifyFollowers: spotifyCount > 0 ? Math.round(spotifyTotal / spotifyCount) : 0,
      youtubeSubscribers: youtubeCount > 0 ? Math.round(youtubeTotal / youtubeCount) : 0,
      instagramFollowers: instagramCount > 0 ? Math.round(instagramTotal / instagramCount) : 0,
      tiktokFollowers: tiktokCount > 0 ? Math.round(tiktokTotal / tiktokCount) : 0,
      spotifyListenersLocal: spotifyLocalCount > 0 ? Math.round(spotifyLocalTotal / spotifyLocalCount) : 0,
      totalPerformances,
      localPerformances
    };

    console.log('VenueService.calculateAverageMetrics: Calculated metrics from real data:', result);
    console.log('VenueService.calculateAverageMetrics: Data availability:', {
      spotifyCount,
      youtubeCount,
      instagramCount,
      tiktokCount,
      spotifyLocalCount,
      totalDataPoints: dataPoints.length
    });
    
    return result;
  }
} 