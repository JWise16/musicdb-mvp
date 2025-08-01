export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          admin_level: string | null
          created_at: string | null
          created_by: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_level?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_level?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      artists: {
        Row: {
          contact_info: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          is_admin_added: boolean | null
          name: string
          social_media: Json | null
          updated_at: string | null
        }
        Insert: {
          contact_info?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_admin_added?: boolean | null
          name: string
          social_media?: Json | null
          updated_at?: string | null
        }
        Update: {
          contact_info?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_admin_added?: boolean | null
          name?: string
          social_media?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      event_artists: {
        Row: {
          artist_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          is_admin_added: boolean | null
          is_headliner: boolean | null
          performance_order: number | null
        }
        Insert: {
          artist_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_admin_added?: boolean | null
          is_headliner?: boolean | null
          performance_order?: number | null
        }
        Update: {
          artist_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_admin_added?: boolean | null
          is_headliner?: boolean | null
          performance_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_metrics: {
        Row: {
          attendance: number | null
          bar_sales_per_attendee: number | null
          created_at: string | null
          event_id: string | null
          id: string
          is_admin_added: boolean | null
          is_public: boolean | null
          ticket_revenue: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          attendance?: number | null
          bar_sales_per_attendee?: number | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_admin_added?: boolean | null
          is_public?: boolean | null
          ticket_revenue?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          attendance?: number | null
          bar_sales_per_attendee?: number | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_admin_added?: boolean | null
          is_public?: boolean | null
          ticket_revenue?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_metrics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          bar_sales: number | null
          created_at: string | null
          date: string
          id: string
          is_admin_added: boolean | null
          name: string
          notes: string | null
          ticket_price: number | null
          ticket_price_max: number | null
          ticket_price_min: number | null
          tickets_sold: number | null
          total_ticket_revenue: number | null
          total_tickets: number
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          bar_sales?: number | null
          created_at?: string | null
          date: string
          id?: string
          is_admin_added?: boolean | null
          name: string
          notes?: string | null
          ticket_price?: number | null
          ticket_price_max?: number | null
          ticket_price_min?: number | null
          tickets_sold?: number | null
          total_ticket_revenue?: number | null
          total_tickets: number
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          bar_sales?: number | null
          created_at?: string | null
          date?: string
          id?: string
          is_admin_added?: boolean | null
          name?: string
          notes?: string | null
          ticket_price?: number | null
          ticket_price_max?: number | null
          ticket_price_min?: number | null
          tickets_sold?: number | null
          total_ticket_revenue?: number | null
          total_tickets?: number
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_admin: boolean | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_admin?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_admin?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_venues: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_venues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          capacity: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_admin_added: boolean | null
          location: string
          name: string
          updated_at: string | null
        }
        Insert: {
          address: string
          capacity?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_admin_added?: boolean | null
          location: string
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          capacity?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_admin_added?: boolean | null
          location?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_user_stats: {
        Row: {
          avatar_url: string | null
          email: string | null
          events_this_month: number | null
          full_name: string | null
          is_admin: boolean | null
          last_activity: string | null
          last_login: string | null
          onboarding_status: string | null
          profile_created: string | null
          profile_updated: string | null
          role: string | null
          signup_date: string | null
          total_events: number | null
          total_revenue: number | null
          user_id: string | null
          venue_count: number | null
          venue_names: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
