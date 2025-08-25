import { supabase } from '../supabaseClient';
import type { Database } from '../database.types';

type EventFile = Database['public']['Tables']['event_files']['Row'];
type EventFileInsert = Database['public']['Tables']['event_files']['Insert'];
type EventFileUpdate = Database['public']['Tables']['event_files']['Update'];

export interface UploadResult {
  success: boolean;
  fileId?: string;
  publicUrl?: string;
  error?: string;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class EventFileService {
  private static readonly BUCKET_NAME = 'event-files';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf'
  ];

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload CSV, Excel (.xlsx, .xls), or PDF files.'
      };
    }

    return { valid: true };
  }

  /**
   * Upload event file to Supabase Storage and create database record
   */
  static async uploadEventFile(
    userId: string,
    venueId: string,
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Starting event file upload:', {
        userId,
        venueId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const uniqueFileName = `${userId}-${timestamp}.${fileExt}`;
      const filePath = `${userId}/${uniqueFileName}`;

      console.log('Uploading to path:', filePath);

      // Simulate progress for user feedback (Supabase doesn't provide native progress tracking)
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 });
        
        // Simulate progress during upload
        const progressInterval = setInterval(() => {
          const currentProgress = Math.min(Math.random() * 90, 85); // Stay below 90% until complete
          onProgress({ 
            loaded: Math.round((currentProgress / 100) * file.size), 
            total: file.size, 
            percentage: Math.round(currentProgress) 
          });
        }, 200);

        // Clear interval after 3 seconds (typical upload time for small files)
        setTimeout(() => clearInterval(progressInterval), 3000);
      }

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });

      // Complete progress
      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return { success: false, error: uploadError.message };
      }

      console.log('Upload successful, data:', uploadData);

      // Get public URL (even though bucket is private, we'll store the URL for admin access)
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      // Create database record
      const eventFileData: EventFileInsert = {
        user_id: userId,
        venue_id: venueId,
        file_name: uniqueFileName,
        original_file_name: file.name,
        file_size: file.size,
        file_type: fileExt || 'unknown',
        mime_type: file.type,
        storage_path: filePath,
        public_url: urlData.publicUrl,
        status: 'pending',
        metadata: {
          upload_timestamp: timestamp,
          original_size: file.size,
          browser_info: navigator.userAgent
        }
      };

      const { data: dbData, error: dbError } = await supabase
        .from('event_files')
        .insert(eventFileData)
        .select()
        .single();

      if (dbError) {
        console.error('Error creating database record:', dbError);
        
        // If database insert fails, clean up the uploaded file
        await this.deleteFile(filePath);
        
        return { success: false, error: 'Failed to create file record in database' };
      }

      console.log('Database record created:', dbData);

      return {
        success: true,
        fileId: dbData.id,
        publicUrl: urlData.publicUrl
      };

    } catch (error) {
      console.error('Error in uploadEventFile:', error);
      return { success: false, error: 'Failed to upload file' };
    }
  }

  /**
   * Get all files for a user
   */
  static async getUserFiles(userId: string): Promise<{ data: EventFile[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('event_files')
        .select(`
          *,
          venues:venue_id (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user files:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getUserFiles:', error);
      return { data: null, error: 'Failed to fetch files' };
    }
  }

  /**
   * Get files for a specific venue
   */
  static async getVenueFiles(venueId: string): Promise<{ data: EventFile[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('event_files')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching venue files:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getVenueFiles:', error);
      return { data: null, error: 'Failed to fetch venue files' };
    }
  }

  /**
   * Update file status
   */
  static async updateFileStatus(
    fileId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: EventFileUpdate = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('event_files')
        .update(updateData)
        .eq('id', fileId);

      if (error) {
        console.error('Error updating file status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateFileStatus:', error);
      return { success: false, error: 'Failed to update file status' };
    }
  }

  /**
   * Delete file from storage and database
   */
  static async deleteEventFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the file record to get the storage path
      const { data: fileRecord, error: fetchError } = await supabase
        .from('event_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileRecord) {
        return { success: false, error: 'File not found' };
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileRecord.storage_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue to delete database record even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('event_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Error deleting from database:', dbError);
        return { success: false, error: dbError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteEventFile:', error);
      return { success: false, error: 'Failed to delete file' };
    }
  }

  /**
   * Delete file from storage (helper method)
   */
  private static async deleteFile(filePath: string): Promise<void> {
    try {
      await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting file from storage:', error);
    }
  }

  /**
   * Get signed URL for private file access
   */
  static async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return { url: null, error: error.message };
      }

      return { url: data.signedUrl, error: null };
    } catch (error) {
      console.error('Error in getSignedUrl:', error);
      return { url: null, error: 'Failed to create signed URL' };
    }
  }
}
