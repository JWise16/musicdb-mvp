import { supabase } from '../supabaseClient';
import type { Tables } from '../types/database.types';

export type VenueData = {
  name: string;
  location: string;
  address: string;
  capacity?: number;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
};

export type UserVenueData = {
  user_id: string;
  venue_id: string;
  role: string;
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
} 