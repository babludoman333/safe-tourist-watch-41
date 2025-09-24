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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_a857ad95a4_alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          latitude: number | null
          longitude: number | null
          message: string
          severity: string | null
          tourist_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          latitude?: number | null
          longitude?: number | null
          message: string
          severity?: string | null
          tourist_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          latitude?: number | null
          longitude?: number | null
          message?: string
          severity?: string | null
          tourist_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_a857ad95a4_alerts_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "app_a857ad95a4_tourists"
            referencedColumns: ["tourist_id"]
          },
        ]
      }
      app_a857ad95a4_checkins: {
        Row: {
          address: string | null
          created_at: string
          id: string
          itinerary_id: string | null
          latitude: number
          longitude: number
          notes: string | null
          status: string | null
          tourist_id: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          itinerary_id?: string | null
          latitude: number
          longitude: number
          notes?: string | null
          status?: string | null
          tourist_id: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          itinerary_id?: string | null
          latitude?: number
          longitude?: number
          notes?: string | null
          status?: string | null
          tourist_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_a857ad95a4_checkins_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "app_a857ad95a4_itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_a857ad95a4_checkins_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "app_a857ad95a4_tourists"
            referencedColumns: ["tourist_id"]
          },
        ]
      }
      app_a857ad95a4_destinations: {
        Row: {
          auto_checkin_interval: number
          created_at: string | null
          id: string
          itinerary_id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          order_index: number
          planned_arrival: string
          status: string
          tourist_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_checkin_interval?: number
          created_at?: string | null
          id?: string
          itinerary_id: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          order_index?: number
          planned_arrival: string
          status?: string
          tourist_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_checkin_interval?: number
          created_at?: string | null
          id?: string
          itinerary_id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          order_index?: number
          planned_arrival?: string
          status?: string
          tourist_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_destinations_itinerary"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "app_a857ad95a4_itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_itinerary"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "app_a857ad95a4_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      app_a857ad95a4_efirs: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          efir_id: string
          filed_at: string | null
          generated_at: string
          id: string
          reason: string
          status: string
          tourist_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          efir_id: string
          filed_at?: string | null
          generated_at?: string
          id?: string
          reason: string
          status?: string
          tourist_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          efir_id?: string
          filed_at?: string | null
          generated_at?: string
          id?: string
          reason?: string
          status?: string
          tourist_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_a857ad95a4_efirs_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "app_a857ad95a4_tourists"
            referencedColumns: ["tourist_id"]
          },
        ]
      }
      app_a857ad95a4_emergency_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          order_index: number
          phone: string
          relationship: string
          tourist_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          order_index?: number
          phone: string
          relationship: string
          tourist_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          order_index?: number
          phone?: string
          relationship?: string
          tourist_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_a857ad95a4_hazards: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          message: string
          radius_km: number | null
          severity: string | null
          type: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          message: string
          radius_km?: number | null
          severity?: string | null
          type: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          message?: string
          radius_km?: number | null
          severity?: string | null
          type?: string
        }
        Relationships: []
      }
      app_a857ad95a4_incidents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          incident_id: string
          latitude: number
          longitude: number
          resolved_at: string | null
          status: string | null
          tourist_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          incident_id: string
          latitude: number
          longitude: number
          resolved_at?: string | null
          status?: string | null
          tourist_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          incident_id?: string
          latitude?: number
          longitude?: number
          resolved_at?: string | null
          status?: string | null
          tourist_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_a857ad95a4_incidents_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "app_a857ad95a4_tourists"
            referencedColumns: ["tourist_id"]
          },
        ]
      }
      app_a857ad95a4_itineraries: {
        Row: {
          auto_checkin_interval: number | null
          created_at: string
          destinations: Json
          end_date: string
          id: string
          notes: string | null
          start_date: string
          status: string | null
          tittle: string | null
          tourist_id: string
          updated_at: string
          user_id: string
          waypoints: Json | null
        }
        Insert: {
          auto_checkin_interval?: number | null
          created_at?: string
          destinations: Json
          end_date: string
          id?: string
          notes?: string | null
          start_date: string
          status?: string | null
          tittle?: string | null
          tourist_id: string
          updated_at?: string
          user_id: string
          waypoints?: Json | null
        }
        Update: {
          auto_checkin_interval?: number | null
          created_at?: string
          destinations?: Json
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: string | null
          tittle?: string | null
          tourist_id?: string
          updated_at?: string
          user_id?: string
          waypoints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "app_a857ad95a4_itineraries_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "app_a857ad95a4_tourists"
            referencedColumns: ["tourist_id"]
          },
        ]
      }
      app_a857ad95a4_location_logs: {
        Row: {
          accuracy: string | null
          address: string | null
          id: string
          in_restricted_zone: boolean | null
          latitude: number
          longitude: number
          timestamp: string
          tourist_id: string
          user_id: string
        }
        Insert: {
          accuracy?: string | null
          address?: string | null
          id?: string
          in_restricted_zone?: boolean | null
          latitude: number
          longitude: number
          timestamp?: string
          tourist_id: string
          user_id: string
        }
        Update: {
          accuracy?: string | null
          address?: string | null
          id?: string
          in_restricted_zone?: boolean | null
          latitude?: number
          longitude?: number
          timestamp?: string
          tourist_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_a857ad95a4_location_logs_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "app_a857ad95a4_tourists"
            referencedColumns: ["tourist_id"]
          },
        ]
      }
      app_a857ad95a4_restricted_zones: {
        Row: {
          coordinates: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          severity: string | null
        }
        Insert: {
          coordinates: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          severity?: string | null
        }
        Update: {
          coordinates?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          severity?: string | null
        }
        Relationships: []
      }
      app_a857ad95a4_tourists: {
        Row: {
          blockchain_hash: string | null
          created_at: string
          doc_id: string
          doc_type: string
          emergency_contact: string
          id: string
          language: string | null
          last_known_location: Json | null
          medical_info: string | null
          name: string
          nationality: string
          qr_code_url: string | null
          tourist_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blockchain_hash?: string | null
          created_at?: string
          doc_id: string
          doc_type: string
          emergency_contact: string
          id?: string
          language?: string | null
          last_known_location?: Json | null
          medical_info?: string | null
          name: string
          nationality: string
          qr_code_url?: string | null
          tourist_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blockchain_hash?: string | null
          created_at?: string
          doc_id?: string
          doc_type?: string
          emergency_contact?: string
          id?: string
          language?: string | null
          last_known_location?: Json | null
          medical_info?: string | null
          name?: string
          nationality?: string
          qr_code_url?: string | null
          tourist_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
