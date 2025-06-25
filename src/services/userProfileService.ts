import { supabase } from '../supabaseClient';
import type { Database } from '../types/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export class UserProfileService {
  static async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return { data: null, error: 'Failed to fetch user profile' };
    }
  }

  static async updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return { data: null, error: 'Failed to update user profile' };
    }
  }

  static async createUserProfile(profile: UserProfileInsert): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profile)
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return { data: null, error: 'Failed to create user profile' };
    }
  }

  static async uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: string | null }> {
    try {
      console.log('Starting avatar upload for user:', userId);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Remove the avatars/ prefix since bucket is already specified

      console.log('Uploading to path:', filePath);

      // Upload file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return { url: null, error: uploadError.message };
      }

      console.log('Upload successful, data:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', urlData.publicUrl);

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return { url: null, error: 'Failed to upload avatar' };
    }
  }

  static async deleteAvatar(userId: string, avatarUrl: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Extract filename from URL
      const urlParts = avatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `avatars/${userId}-${fileName}`;

      // Delete file from Supabase Storage
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting avatar:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in deleteAvatar:', error);
      return { success: false, error: 'Failed to delete avatar' };
    }
  }

  static async updateProfileWithAvatar(
    userId: string, 
    profileUpdates: UserProfileUpdate, 
    avatarFile?: File
  ): Promise<{ data: UserProfile | null; error: string | null }> {
    try {
      let avatarUrl = profileUpdates.avatar_url;

      // Upload new avatar if provided
      if (avatarFile) {
        const uploadResult = await this.uploadAvatar(userId, avatarFile);
        if (uploadResult.error) {
          return { data: null, error: uploadResult.error };
        }
        avatarUrl = uploadResult.url;
      }

      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          full_name: profileUpdates.full_name || '',
          bio: profileUpdates.bio,
          role: profileUpdates.role,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting user profile:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateProfileWithAvatar:', error);
      return { data: null, error: 'Failed to update profile with avatar' };
    }
  }
} 