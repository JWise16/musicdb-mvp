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
  trends: {
    showsReported: { value: number }[];
    ticketSales: { value: number }[];
    barSales: { value: number }[];
    avgSelloutRate: { value: number }[];
    avgTicketPrice: { value: number }[];
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

      // Calculate trends (last 6 months or periods)
      const trends = this.calculateTrends(events);
      
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
        topMonth: { month: topMonth[0], count: topMonth[1] },
        topGenre: { genre: topGenre[0], count: topGenre[1] },
        topArtist: { name: topArtist[0], count: topArtist[1] },
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
        trends: {
          showsReported: acc.trends.showsReported.map((point, index) => ({
            value: point.value + (analytics.trends.showsReported[index]?.value || 0)
          })),
          ticketSales: acc.trends.ticketSales.map((point, index) => ({
            value: point.value + (analytics.trends.ticketSales[index]?.value || 0)
          })),
          barSales: acc.trends.barSales.map((point, index) => ({
            value: point.value + (analytics.trends.barSales[index]?.value || 0)
          })),
          avgSelloutRate: acc.trends.avgSelloutRate.map((point, index) => ({
            value: point.value + (analytics.trends.avgSelloutRate[index]?.value || 0)
          })),
          avgTicketPrice: acc.trends.avgTicketPrice.map((point, index) => ({
            value: point.value + (analytics.trends.avgTicketPrice[index]?.value || 0)
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
      }), this.getDefaultAnalytics());

      // Calculate averages
      const venueCount = venueAnalytics.length;
      if (venueCount > 0) {
        combined.avgSelloutRate = combined.avgSelloutRate / venueCount;
        combined.avgTicketPrice = combined.avgTicketPrice / venueCount;
        
        // Average the trend data for rate-based metrics
        combined.trends.avgSelloutRate = combined.trends.avgSelloutRate.map(point => ({
          value: point.value / venueCount
        }));
        combined.trends.avgTicketPrice = combined.trends.avgTicketPrice.map(point => ({
          value: point.value / venueCount
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
  private static calculateTrends(events: any[]): VenueAnalytics['trends'] {
    // Group events by month for the last 6 months
    const now = new Date();
    const periods: Date[] = [];
    
    // Generate 6 month periods
    for (let i = 5; i >= 0; i--) {
      const periodDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(periodDate);
    }

    const periodData = periods.map(period => {
      const periodEnd = new Date(period.getFullYear(), period.getMonth() + 1, 0);
      const periodEvents = events.filter(event => {
        const eventDate = parseEventDate(event.date);
        return eventDate >= period && eventDate <= periodEnd;
      });

      let totalTicketSales = 0;
      let totalBarSales = 0;
      let totalTicketsSold = 0;
      let totalTicketsAvailable = 0;
      let totalTicketRevenue = 0;

      periodEvents.forEach(event => {
        const ticketsSold = event.tickets_sold || 0;
        const ticketPrice = event.ticket_price || 0;
        const barSales = event.bar_sales || 0;
        const totalTickets = event.total_tickets || 0;

        totalTicketsSold += ticketsSold;
        totalTicketsAvailable += totalTickets;
        totalTicketRevenue += ticketsSold * ticketPrice;
        totalBarSales += barSales;
        totalTicketSales += ticketsSold * ticketPrice;
      });

      const avgSelloutRate = totalTicketsAvailable > 0 ? (totalTicketsSold / totalTicketsAvailable) * 100 : 0;
      const avgTicketPrice = totalTicketsSold > 0 ? totalTicketRevenue / totalTicketsSold : 0;

      return {
        showsReported: periodEvents.length,
        ticketSales: totalTicketSales,
        barSales: totalBarSales,
        avgSelloutRate,
        avgTicketPrice
      };
    });

    return {
      showsReported: periodData.map(p => ({ value: p.showsReported })),
      ticketSales: periodData.map(p => ({ value: p.ticketSales })),
      barSales: periodData.map(p => ({ value: p.barSales })),
      avgSelloutRate: periodData.map(p => ({ value: p.avgSelloutRate })),
      avgTicketPrice: periodData.map(p => ({ value: p.avgTicketPrice }))
    };
  }

  // Default analytics for empty state
  public static getDefaultAnalytics(): VenueAnalytics {
    const emptyTrend = [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const emptyMonthlyData = months.map(month => ({ month, percentage: 0 }));
    
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const emptyQuarterlyData = quarters.map(quarter => ({ quarter, percentage: 0 }));
    
    const now = new Date();
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
      topMonth: { month: 'N/A', count: 0 },
      topGenre: { genre: 'N/A', count: 0 },
      topArtist: { name: 'N/A', count: 0 },
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
} 