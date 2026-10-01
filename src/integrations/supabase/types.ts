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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          attention_reason: string | null
          client_id: string
          client_note: string | null
          created_at: string
          end_at: string
          fee_cents: number | null
          filed_at: string | null
          finished_at: string | null
          id: string
          intake_answers: Json
          manage_token: string
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          needs_attention: boolean
          paid_at: string | null
          paid_method: string | null
          ready_score: number
          service_id: string
          signature_status: Database["public"]["Enums"]["signature_status"]
          signed_at: string | null
          signed_name: string | null
          start_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          stripe_session_id: string | null
        }
        Insert: {
          attention_reason?: string | null
          client_id: string
          client_note?: string | null
          created_at?: string
          end_at: string
          fee_cents?: number | null
          filed_at?: string | null
          finished_at?: string | null
          id?: string
          intake_answers?: Json
          manage_token?: string
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          needs_attention?: boolean
          paid_at?: string | null
          paid_method?: string | null
          ready_score?: number
          service_id: string
          signature_status?: Database["public"]["Enums"]["signature_status"]
          signed_at?: string | null
          signed_name?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          stripe_session_id?: string | null
        }
        Update: {
          attention_reason?: string | null
          client_id?: string
          client_note?: string | null
          created_at?: string
          end_at?: string
          fee_cents?: number | null
          filed_at?: string | null
          finished_at?: string | null
          id?: string
          intake_answers?: Json
          manage_token?: string
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          needs_attention?: boolean
          paid_at?: string | null
          paid_method?: string | null
          ready_score?: number
          service_id?: string
          signature_status?: Database["public"]["Enums"]["signature_status"]
          signed_at?: string | null
          signed_name?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_config: {
        Row: {
          cron_token: string
          id: number
        }
        Insert: {
          cron_token?: string
          id?: number
        }
        Update: {
          cron_token?: string
          id?: number
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          ai_check: string | null
          ai_note: string | null
          appointment_id: string
          description: string | null
          document_name: string
          file_path: string | null
          fix_note: string | null
          fix_reason: string | null
          id: string
          na_reason: string | null
          required: boolean
          review_status: string
          sort_order: number
          status: Database["public"]["Enums"]["checklist_status"]
          uploaded_at: string | null
        }
        Insert: {
          ai_check?: string | null
          ai_note?: string | null
          appointment_id: string
          description?: string | null
          document_name: string
          file_path?: string | null
          fix_note?: string | null
          fix_reason?: string | null
          id?: string
          na_reason?: string | null
          required?: boolean
          review_status?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["checklist_status"]
          uploaded_at?: string | null
        }
        Update: {
          ai_check?: string | null
          ai_note?: string | null
          appointment_id?: string
          description?: string | null
          document_name?: string
          file_path?: string | null
          fix_note?: string | null
          fix_reason?: string | null
          id?: string
          na_reason?: string | null
          required?: boolean
          review_status?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["checklist_status"]
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string
          id: string
          is_returning: boolean
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_returning?: boolean
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_returning?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      demo_snapshot: {
        Row: {
          rows: Json
          taken_at: string
          tbl: string
        }
        Insert: {
          rows: Json
          taken_at?: string
          tbl: string
        }
        Update: {
          rows?: Json
          taken_at?: string
          tbl?: string
        }
        Relationships: []
      }
      document_rules: {
        Row: {
          active: boolean
          condition: string
          description: string | null
          document_name: string
          id: string
          required: boolean
          service_id: string | null
          sort_order: number
        }
        Insert: {
          active?: boolean
          condition: string
          description?: string | null
          document_name: string
          id?: string
          required?: boolean
          service_id?: string | null
          sort_order?: number
        }
        Update: {
          active?: boolean
          condition?: string
          description?: string | null
          document_name?: string
          id?: string
          required?: boolean
          service_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          ai_reply: string | null
          created_at: string
          email: string
          id: string
          name: string
          question: string
          replied_at: string | null
          reply: string | null
          status: string
        }
        Insert: {
          ai_reply?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          question: string
          replied_at?: string | null
          reply?: string | null
          status?: string
        }
        Update: {
          ai_reply?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          question?: string
          replied_at?: string | null
          reply?: string | null
          status?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          converted: boolean
          created_at: string
          email: string
          id: string
          last_step: string | null
          name: string | null
          nudged_at: string | null
          partial_booking: Json
        }
        Insert: {
          converted?: boolean
          created_at?: string
          email: string
          id?: string
          last_step?: string | null
          name?: string | null
          nudged_at?: string | null
          partial_booking?: Json
        }
        Update: {
          converted?: boolean
          created_at?: string
          email?: string
          id?: string
          last_step?: string | null
          name?: string | null
          nudged_at?: string | null
          partial_booking?: Json
        }
        Relationships: []
      }
      meeting_notes: {
        Row: {
          action_items: Json
          appointment_id: string
          duration_min: number | null
          id: string
          key_points: Json
          recorded_at: string
          status: string
          summary: string | null
          transcript: Json
        }
        Insert: {
          action_items?: Json
          appointment_id: string
          duration_min?: number | null
          id?: string
          key_points?: Json
          recorded_at?: string
          status?: string
          summary?: string | null
          transcript?: Json
        }
        Update: {
          action_items?: Json
          appointment_id?: string
          duration_min?: number | null
          id?: string
          key_points?: Json
          recorded_at?: string
          status?: string
          summary?: string | null
          transcript?: Json
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          appointment_id: string | null
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          client_id: string | null
          dedupe_key: string | null
          delivery: string
          error: string | null
          id: string
          minutes_saved: number
          recipient: string | null
          sent_at: string
          subject: string | null
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          appointment_id?: string | null
          body: string
          channel?: Database["public"]["Enums"]["message_channel"]
          client_id?: string | null
          dedupe_key?: string | null
          delivery?: string
          error?: string | null
          id?: string
          minutes_saved?: number
          recipient?: string | null
          sent_at?: string
          subject?: string | null
          type: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          appointment_id?: string | null
          body?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          client_id?: string | null
          dedupe_key?: string | null
          delivery?: string
          error?: string | null
          id?: string
          minutes_saved?: number
          recipient?: string | null
          sent_at?: string
          subject?: string | null
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          description: string | null
          duration_min: number
          id: string
          is_from_price: boolean
          name: string
          price_from: number
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          description?: string | null
          duration_min: number
          id?: string
          is_from_price?: boolean
          name: string
          price_from: number
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          description?: string | null
          duration_min?: number
          id?: string
          is_from_price?: boolean
          name?: string
          price_from?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          buffer_min: number
          demo_time_offset_minutes: number
          hours: Json
          id: number
          reminder_timings: Json
          timezone: string
          video_link: string | null
        }
        Insert: {
          buffer_min?: number
          demo_time_offset_minutes?: number
          hours: Json
          id?: number
          reminder_timings: Json
          timezone?: string
          video_link?: string | null
        }
        Update: {
          buffer_min?: number
          demo_time_offset_minutes?: number
          hours?: Json
          id?: number
          reminder_timings?: Json
          timezone?: string
          video_link?: string | null
        }
        Relationships: []
      }
      time_off: {
        Row: {
          all_day: boolean
          created_at: string
          ends_at: string
          id: string
          label: string | null
          starts_at: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          ends_at: string
          id?: string
          label?: string | null
          starts_at: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          label?: string | null
          starts_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          client_id: string
          created_at: string
          id: string
          preferred_days: string[]
          service_id: string
          status: Database["public"]["Enums"]["waitlist_status"]
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          preferred_days?: string[]
          service_id: string
          status?: Database["public"]["Enums"]["waitlist_status"]
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          preferred_days?: string[]
          service_id?: string
          status?: Database["public"]["Enums"]["waitlist_status"]
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_offers: {
        Row: {
          created_at: string
          id: string
          service_id: string
          slot_start: string
          status: string
          token: string
          waitlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          slot_start: string
          status?: string
          token?: string
          waitlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          slot_start?: string
          status?: string
          token?: string
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_offers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_offers_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlist"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      available_slots: {
        Args: { _from: string; _now: string; _service_id: string; _to: string }
        Returns: string[]
      }
      book_appointment: {
        Args: {
          _email: string
          _intake: Json
          _meeting_type: Database["public"]["Enums"]["meeting_type"]
          _name: string
          _now: string
          _phone: string
          _service_id: string
          _start: string
        }
        Returns: Json
      }
      compute_ready_score: { Args: { _id: string }; Returns: undefined }
      demo_restore: { Args: never; Returns: undefined }
      demo_take_snapshot: { Args: never; Returns: undefined }
      generate_checklist: {
        Args: { _appointment_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: never; Returns: boolean }
      reschedule_appointment: {
        Args: { _id: string; _now: string; _start: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin"
      appointment_status:
        | "booked"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
        | "rescheduled"
      checklist_status: "missing" | "uploaded" | "not_applicable"
      meeting_type: "in_person" | "video"
      message_channel: "email" | "sms"
      message_type:
        | "booking_confirmation"
        | "docs_reminder_7d"
        | "readiness_check_48h"
        | "reschedule_offer"
        | "final_reminder_24h"
        | "waitlist_offer"
        | "abandoned_nudge"
        | "signature_reminder"
        | "missing_docs_after"
        | "new_season"
        | "payment_reminder"
        | "doc_fix_request"
        | "review_sign_pay"
        | "return_filed"
        | "file_reminder"
        | "inquiry_reply"
      signature_status: "not_needed" | "pending" | "signed"
      waitlist_status: "waiting" | "offered" | "booked" | "expired"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
      appointment_status: [
        "booked",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
        "rescheduled",
      ],
      checklist_status: ["missing", "uploaded", "not_applicable"],
      meeting_type: ["in_person", "video"],
      message_channel: ["email", "sms"],
      message_type: [
        "booking_confirmation",
        "docs_reminder_7d",
        "readiness_check_48h",
        "reschedule_offer",
        "final_reminder_24h",
        "waitlist_offer",
        "abandoned_nudge",
        "signature_reminder",
        "missing_docs_after",
        "new_season",
        "payment_reminder",
        "doc_fix_request",
        "review_sign_pay",
        "return_filed",
        "file_reminder",
        "inquiry_reply",
      ],
      signature_status: ["not_needed", "pending", "signed"],
      waitlist_status: ["waiting", "offered", "booked", "expired"],
    },
  },
} as const
