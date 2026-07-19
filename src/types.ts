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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          active: boolean
          alert_type: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          severity: string
          zones: string[]
        }
        Insert: {
          active?: boolean
          alert_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          severity: string
          zones?: string[]
        }
        Update: {
          active?: boolean
          alert_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          severity?: string
          zones?: string[]
        }
        Relationships: []
      }
      crowd_zones: {
        Row: {
          capacity: number
          current_count: number
          density: number
          name: string
          updated_at: string
          zone: string
        }
        Insert: {
          capacity: number
          current_count?: number
          density?: number
          name: string
          updated_at?: string
          zone: string
        }
        Update: {
          capacity?: number
          current_count?: number
          density?: number
          name?: string
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      food_items: {
        Row: {
          category: string
          dietary: string[]
          emoji: string | null
          id: string
          name: string
          price: number
          vendor: string
          wait_minutes: number
          zone: string
        }
        Insert: {
          category: string
          dietary?: string[]
          emoji?: string | null
          id?: string
          name: string
          price: number
          vendor: string
          wait_minutes?: number
          zone: string
        }
        Update: {
          category?: string
          dietary?: string[]
          emoji?: string | null
          id?: string
          name?: string
          price?: number
          vendor?: string
          wait_minutes?: number
          zone?: string
        }
        Relationships: []
      }
      food_orders: {
        Row: {
          created_at: string
          emoji: string | null
          eta_minutes: number | null
          fulfilled_by: string | null
          id: string
          item_id: string | null
          item_name: string
          notes: string | null
          price: number
          quantity: number
          seat_no: string
          status: string
          updated_at: string
          vendor: string
          zone: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          eta_minutes?: number | null
          fulfilled_by?: string | null
          id?: string
          item_id?: string | null
          item_name: string
          notes?: string | null
          price?: number
          quantity?: number
          seat_no: string
          status?: string
          updated_at?: string
          vendor: string
          zone: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          eta_minutes?: number | null
          fulfilled_by?: string | null
          id?: string
          item_id?: string | null
          item_name?: string
          notes?: string | null
          price?: number
          quantity?: number
          seat_no?: string
          status?: string
          updated_at?: string
          vendor?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      help_queue: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          language: string | null
          query: string
          response: string | null
          seat_no: string
          status: string
          zone: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          language?: string | null
          query: string
          response?: string | null
          seat_no: string
          status?: string
          zone?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          language?: string | null
          query?: string
          response?: string | null
          seat_no?: string
          status?: string
          zone?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          incident_type: string
          reported_by: string | null
          severity: string
          status: string
          tx_hash: string | null
          zone: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          incident_type: string
          reported_by?: string | null
          severity: string
          status?: string
          tx_hash?: string | null
          zone: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          incident_type?: string
          reported_by?: string | null
          severity?: string
          status?: string
          tx_hash?: string | null
          zone?: string
        }
        Relationships: []
      }
      staff_directory: {
        Row: {
          name: string
          role: string
          staff_id: string
          zone: string
        }
        Insert: {
          name: string
          role: string
          staff_id: string
          zone: string
        }
        Update: {
          name?: string
          role?: string
          staff_id?: string
          zone?: string
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
