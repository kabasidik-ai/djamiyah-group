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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      conference_rooms: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          features: string[]
          id: string
          images: string[]
          is_available: boolean
          name: string
          price_per_day: number
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          images?: string[]
          is_available?: boolean
          name: string
          price_per_day: number
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          images?: string[]
          is_available?: boolean
          name?: string
          price_per_day?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          loyalty_points: number
          phone: string | null
          total_bookings: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          loyalty_points?: number
          phone?: string | null
          total_bookings?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          loyalty_points?: number
          phone?: string | null
          total_bookings?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          chapchap_transaction_id: string | null
          check_in: string
          check_out: string
          created_at: string
          currency: string
          customer_id: string | null
          email: string
          first_name: string
          guests: number
          hotel_name: string
          id: string
          last_name: string
          payment_method:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_status: Database["public"]["Enums"]["payment_status_enum"]
          phone: string | null
          room_type: string
          status: Database["public"]["Enums"]["reservation_status_enum"]
          total_price: number
          updated_at: string
        }
        Insert: {
          chapchap_transaction_id?: string | null
          check_in: string
          check_out: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          email: string
          first_name: string
          guests: number
          hotel_name: string
          id?: string
          last_name: string
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          phone?: string | null
          room_type: string
          status?: Database["public"]["Enums"]["reservation_status_enum"]
          total_price: number
          updated_at?: string
        }
        Update: {
          chapchap_transaction_id?: string | null
          check_in?: string
          check_out?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          email?: string
          first_name?: string
          guests?: number
          hotel_name?: string
          id?: string
          last_name?: string
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          phone?: string | null
          room_type?: string
          status?: Database["public"]["Enums"]["reservation_status_enum"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          features: Json
          id: string
          images: string[]
          is_available: boolean
          name: string
          price_per_night: number
          type: Database["public"]["Enums"]["room_type_enum"]
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          images?: string[]
          is_available?: boolean
          name: string
          price_per_night: number
          type: Database["public"]["Enums"]["room_type_enum"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          images?: string[]
          is_available?: boolean
          name?: string
          price_per_night?: number
          type?: Database["public"]["Enums"]["room_type_enum"]
          updated_at?: string
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
      payment_method_enum: "orange_money" | "mtn_momo" | "card" | "cash"
      payment_status_enum: "pending" | "paid" | "failed" | "refunded"
      reservation_status_enum:
        | "confirmed"
        | "cancelled"
        | "completed"
        | "pending"
      room_type_enum: "standard" | "premium" | "suite"
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
      payment_method_enum: ["orange_money", "mtn_momo", "card", "cash"],
      payment_status_enum: ["pending", "paid", "failed", "refunded"],
      reservation_status_enum: [
        "confirmed",
        "cancelled",
        "completed",
        "pending",
      ],
      room_type_enum: ["standard", "premium", "suite"],
    },
  },
} as const
