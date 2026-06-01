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
      chat_conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_group: boolean
          last_message_at: string
          name: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_group?: boolean
          last_message_at?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_group?: boolean
          last_message_at?: string
          name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reads: {
        Row: {
          conversation_id: string
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          incident_at: string | null
          incident_type: string | null
          location_name: string
          photo_url: string | null
          shift_id: string | null
          shift_session_id: string | null
        }
        Insert: {
          author_user_id: string
          content: string
          created_at?: string
          id?: string
          incident_at?: string | null
          incident_type?: string | null
          location_name: string
          photo_url?: string | null
          shift_id?: string | null
          shift_session_id?: string | null
        }
        Update: {
          author_user_id?: string
          content?: string
          created_at?: string
          id?: string
          incident_at?: string | null
          incident_type?: string | null
          location_name?: string
          photo_url?: string | null
          shift_id?: string | null
          shift_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guard_log_entries_shift_session_id_fkey"
            columns: ["shift_session_id"]
            isOneToOne: false
            referencedRelation: "shift_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      patrol_points: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string
          id: string
          lat: number | null
          lng: number | null
          location: string
          name: string
          nfc_id: string | null
          order_index: number
          qr_secret: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by: string
          id?: string
          lat?: number | null
          lng?: number | null
          location: string
          name: string
          nfc_id?: string | null
          order_index?: number
          qr_secret?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string
          name?: string
          nfc_id?: string | null
          order_index?: number
          qr_secret?: string
        }
        Relationships: []
      }
      patrol_route_points: {
        Row: {
          created_at: string
          id: string
          order_index: number
          point_id: string
          route_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          point_id: string
          route_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          point_id?: string
          route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrol_route_points_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "patrol_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrol_route_points_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "patrol_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      patrol_routes: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          id: string
          location: string
          name: string
          required_points: number
          required_rounds: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          id?: string
          location: string
          name: string
          required_points?: number
          required_rounds?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          id?: string
          location?: string
          name?: string
          required_points?: number
          required_rounds?: number
        }
        Relationships: []
      }
      patrol_scans: {
        Row: {
          distance_m: number | null
          id: string
          lat: number | null
          lng: number | null
          point_id: string
          route_id: string | null
          scan_method: string
          scanned_at: string
          session_id: string | null
          shift_session_id: string | null
          user_id: string
          valid: boolean
        }
        Insert: {
          distance_m?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          point_id: string
          route_id?: string | null
          scan_method?: string
          scanned_at?: string
          session_id?: string | null
          shift_session_id?: string | null
          user_id: string
          valid?: boolean
        }
        Update: {
          distance_m?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          point_id?: string
          route_id?: string | null
          scan_method?: string
          scanned_at?: string
          session_id?: string | null
          shift_session_id?: string | null
          user_id?: string
          valid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "patrol_scans_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "patrol_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrol_scans_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "patrol_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patrol_scans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "patrol_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      patrol_sessions: {
        Row: {
          created_at: string
          end_lat: number | null
          end_lng: number | null
          ended_at: string | null
          id: string
          route_id: string | null
          start_lat: number | null
          start_lng: number | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_lat?: number | null
          end_lng?: number | null
          ended_at?: string | null
          id?: string
          route_id?: string | null
          start_lat?: number | null
          start_lng?: number | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_lat?: number | null
          end_lng?: number | null
          ended_at?: string | null
          id?: string
          route_id?: string | null
          start_lat?: number | null
          start_lng?: number | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrol_sessions_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "patrol_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          user_id?: string
          username?: string | null
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
          shift_id: string | null
          shift_session_id: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          shift_id?: string | null
          shift_session_id?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          shift_id?: string | null
          shift_session_id?: string | null
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
      shift_sessions: {
        Row: {
          created_at: string
          end_lat: number | null
          end_lng: number | null
          end_time: string | null
          id: string
          object_location: string
          shift_id: string | null
          start_lat: number | null
          start_lng: number | null
          start_time: string
          status: Database["public"]["Enums"]["shift_session_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          end_lat?: number | null
          end_lng?: number | null
          end_time?: string | null
          id?: string
          object_location: string
          shift_id?: string | null
          start_lat?: number | null
          start_lng?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["shift_session_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          end_lat?: number | null
          end_lng?: number | null
          end_time?: string | null
          id?: string
          object_location?: string
          shift_id?: string | null
          start_lat?: number | null
          start_lng?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["shift_session_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_sessions_shift_id_fkey"
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      are_friends: { Args: { _a: string; _b: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      end_patrol_session: {
        Args: { _lat: number; _lng: number; _session_id: string }
        Returns: string
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
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
      get_profile_basic: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      get_profiles_basic_bulk: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      get_unread_chat_counts: {
        Args: { _user: string }
        Returns: {
          conversation_id: string
          unread: number
        }[]
      }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_conversation_member: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      is_planner: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      record_patrol_scan: {
        Args: {
          _lat: number
          _lng: number
          _nfc_id: string
          _payload: string
          _route_id: string
          _scanned_at?: string
          _session_id: string
        }
        Returns: string
      }
      search_profiles: {
        Args: { _q: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      sign_patrol_qr: { Args: { _point_id: string }; Returns: string }
      start_patrol_session: {
        Args: { _lat: number; _lng: number; _route_id: string }
        Returns: string
      }
      verify_patrol_qr: {
        Args: { _payload: string }
        Returns: {
          code: string
          lat: number
          lng: number
          location: string
          name: string
          point_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "employee" | "objektleiter"
      assignment_status: "pending" | "accepted" | "declined" | "cancelled"
      service_type: "security" | "cleaning"
      shift_session_status: "active" | "finished"
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
      shift_session_status: ["active", "finished"],
    },
  },
} as const
