export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          total_bookings: number;
          total_spent: number;
          loyalty_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          total_bookings?: number;
          total_spent?: number;
          loyalty_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          total_bookings?: number;
          total_spent?: number;
          loyalty_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          type: Database["public"]["Enums"]["room_type_enum"];
          price_per_night: number;
          capacity: number;
          description: string | null;
          features: Json;
          images: string[];
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: Database["public"]["Enums"]["room_type_enum"];
          price_per_night: number;
          capacity: number;
          description?: string | null;
          features?: Json;
          images?: string[];
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: Database["public"]["Enums"]["room_type_enum"];
          price_per_night?: number;
          capacity?: number;
          description?: string | null;
          features?: Json;
          images?: string[];
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conference_rooms: {
        Row: {
          id: string;
          name: string;
          capacity: number;
          price_per_day: number;
          description: string | null;
          features: string[];
          images: string[];
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          capacity: number;
          price_per_day: number;
          description?: string | null;
          features?: string[];
          images?: string[];
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          capacity?: number;
          price_per_day?: number;
          description?: string | null;
          features?: string[];
          images?: string[];
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          hotel_name: string;
          room_type: string;
          check_in: string;
          check_out: string;
          guests: number;
          total_price: number;
          currency: string;
          payment_status: Database["public"]["Enums"]["payment_status_enum"];
          payment_method: Database["public"]["Enums"]["payment_method_enum"] | null;
          chapchap_transaction_id: string | null;
          status: Database["public"]["Enums"]["reservation_status_enum"];
          customer_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          hotel_name: string;
          room_type: string;
          check_in: string;
          check_out: string;
          guests: number;
          total_price: number;
          currency?: string;
          payment_status?: Database["public"]["Enums"]["payment_status_enum"];
          payment_method?: Database["public"]["Enums"]["payment_method_enum"] | null;
          chapchap_transaction_id?: string | null;
          status?: Database["public"]["Enums"]["reservation_status_enum"];
          customer_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          hotel_name?: string;
          room_type?: string;
          check_in?: string;
          check_out?: string;
          guests?: number;
          total_price?: number;
          currency?: string;
          payment_status?: Database["public"]["Enums"]["payment_status_enum"];
          payment_method?: Database["public"]["Enums"]["payment_method_enum"] | null;
          chapchap_transaction_id?: string | null;
          status?: Database["public"]["Enums"]["reservation_status_enum"];
          customer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      payment_status_enum: "pending" | "paid" | "failed" | "refunded";
      payment_method_enum: "orange_money" | "mtn_momo" | "card" | "cash";
      reservation_status_enum: "confirmed" | "cancelled" | "completed";
      room_type_enum: "standard" | "premium" | "suite";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicTable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T];

export type Customer = PublicTable<"customers">["Row"];
export type CustomerInsert = PublicTable<"customers">["Insert"];
export type CustomerUpdate = PublicTable<"customers">["Update"];

export type Room = PublicTable<"rooms">["Row"];
export type RoomInsert = PublicTable<"rooms">["Insert"];
export type RoomUpdate = PublicTable<"rooms">["Update"];

export type ConferenceRoom = PublicTable<"conference_rooms">["Row"];
export type ConferenceRoomInsert = PublicTable<"conference_rooms">["Insert"];
export type ConferenceRoomUpdate = PublicTable<"conference_rooms">["Update"];

export type Reservation = PublicTable<"reservations">["Row"];
export type ReservationInsert = PublicTable<"reservations">["Insert"];
export type ReservationUpdate = PublicTable<"reservations">["Update"];