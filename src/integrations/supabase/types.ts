export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      global_activities: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      global_locations: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          geofence_radius_m: number
          id: string
          lat: number | null
          lng: number | null
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          geofence_radius_m?: number
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          geofence_radius_m?: number
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
        }
        Relationships: []
      }
      guard_log_entries: {
        Row: {
          author_user_id: string
          content: string
          created_at: string
          id: string
          location_name: string
          shift_id: string | null
        }
        Insert: {
          author_user_id: string
          content: string
          created_at?: string
          id?: string
          location_name: string
          shift_id?: string | null
        }
        Update: {
          author_user_id?: string
          content?: string
          created_at?: string
          id?: string
          location_name?: string
          shift_id?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          id: string
          note: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string
          id?: string
          note?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          note?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client: string | null
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          client?: string | null
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          client?: string | null
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_activities: {
        Row: {
          id: string
          last_used_at: string
          name: string
          usage_count: number
          user_id: string
        }
        Insert: {
          id?: string
          last_used_at?: string
          name: string
          usage_count?: number
          user_id: string
        }
        Update: {
          id?: string
          last_used_at?: string
          name?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      saved_locations: {
        Row: {
          id: string
          last_used_at: string
          name: string
          usage_count: number
          user_id: string
        }
        Insert: {
          id?: string
          last_used_at?: string
          name: string
          usage_count?: number
          user_id: string
        }
        Update: {
          id?: string
          last_used_at?: string
          name?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      shift_locations: {
        Row: {
          accuracy: number | null
          id: string
          lat: number
          lng: number
          recorded_at: string
          shift_id: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          shift_id: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          shift_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_locations_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          address: string | null
          assignment_status: Database["public"]["Enums"]["assignment_status"]
          created_at: string
          created_by: string
          date: string
          employee_user_id: string
          end_location_at: string | null
          end_location_lat: number | null
          end_location_lng: number | null
          end_time: string
          geofence_radius_m: number | null
          id: string
          lat: number | null
          lng: number | null
          location: string
          location_consent_at: string | null
          location_consent_declined: boolean
          note: string | null
          requires_location: boolean
          responded_at: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          start_location_at: string | null
          start_location_lat: number | null
          start_location_lng: number | null
          start_time: string
        }
        Insert: {
          address?: string | null
          assignment_status?: Database["public"]["Enums"]["assignment_status"]
          created_at?: string
          created_by: string
          date: string
          employee_user_id: string
          end_location_at?: string | null
          end_location_lat?: number | null
          end_location_lng?: number | null
          end_time: string
          geofence_radius_m?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          location: string
          location_consent_at?: string | null
          location_consent_declined?: boolean
          note?: string | null
          requires_location?: boolean
          responded_at?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          start_location_at?: string | null
          start_location_lat?: number | null
          start_location_lng?: number | null
          start_time: string
        }
        Update: {
          address?: string | null
          assignment_status?: Database["public"]["Enums"]["assignment_status"]
          created_at?: string
          created_by?: string
          date?: string
          employee_user_id?: string
          end_location_at?: string | null
          end_location_lat?: number | null
          end_location_lng?: number | null
          end_time?: string
          geofence_radius_m?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string
          location_consent_at?: string | null
          location_consent_declined?: boolean
          note?: string | null
          requires_location?: boolean
          responded_at?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          start_location_at?: string | null
          start_location_lat?: number | null
          start_location_lng?: number | null
          start_time?: string
        }
        Relationships: []
      }
      sos_alerts: {
        Row: {
          created_at: string
          id: string
          lat: number
          lng: number
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          shift_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lat: number
          lng: number
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          shift_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          shift_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          user_id: string
          weekly_target_hours: number
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          weekly_target_hours?: number
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          weekly_target_hours?: number
        }
        Relationships: []
      }
      work_entries: {
        Row: {
          archived: boolean
          break_minutes: number
          created_at: string
          date: string
          description: string
          end_time: string
          id: string
          include_break: boolean
          location: string
          project: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          break_minutes?: number
          created_at?: string
          date: string
          description: string
          end_time: string
          id?: string
          include_break?: boolean
          location: string
          project?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          archived?: boolean
          break_minutes?: number
          created_at?: string
          date?: string
          description?: string
          end_time?: string
          id?: string
          include_break?: boolean
          location?: string
          project?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_nearby_active_sos: {
        Args: { _lat: number; _lng: number }
        Returns: {
          created_at: string
          display_name: string
          distance_m: number
          id: string
          lat: number
          lng: number
          message: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_planner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "employee" | "objektleiter"
      assignment_status: "pending" | "accepted" | "declined" | "cancelled"
      service_type: "security" | "cleaning"
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
    Enums: {
      app_role: ["admin", "employee", "objektleiter"],
      assignment_status: ["pending", "accepted", "declined", "cancelled"],
      service_type: ["security", "cleaning"],
    },
  },
} as const
