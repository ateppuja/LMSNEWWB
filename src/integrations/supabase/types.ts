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
      adab_titles: {
        Row: {
          created_at: string
          title: string
        }
        Insert: {
          created_at?: string
          title: string
        }
        Update: {
          created_at?: string
          title?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          class_id: string
          text: string
          updated_at: string
        }
        Insert: {
          class_id: string
          text?: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          date: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          date: string
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          date?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          grade: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          grade: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      deleted_records_archive: {
        Row: {
          deleted_at: string
          id: string
          record_key: string
          row_data: Json
          table_name: string
        }
        Insert: {
          deleted_at?: string
          id?: string
          record_key: string
          row_data: Json
          table_name: string
        }
        Update: {
          deleted_at?: string
          id?: string
          record_key?: string
          row_data?: Json
          table_name?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          class_id: string
          created_at: string
          id: string
          score: number
          student_id: string
          subject_id: string
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id: string
          score: number
          student_id: string
          subject_id: string
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          score?: number
          student_id?: string
          subject_id?: string
          title?: string
        }
        Relationships: []
      }
      indicators: {
        Row: {
          category: string
          class_id: string
          created_at: string
          id: string
          month: string
          text: string
          title: string | null
        }
        Insert: {
          category: string
          class_id: string
          created_at?: string
          id: string
          month: string
          text: string
          title?: string | null
        }
        Update: {
          category?: string
          class_id?: string
          created_at?: string
          id?: string
          month?: string
          text?: string
          title?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          class_id: string
          created_at: string
          file_link: string | null
          id: string
          instructions: string | null
          publish_date: string
          subject_id: string
          title: string
          video_link: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          file_link?: string | null
          id: string
          instructions?: string | null
          publish_date: string
          subject_id: string
          title: string
          video_link?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          file_link?: string | null
          id?: string
          instructions?: string | null
          publish_date?: string
          subject_id?: string
          title?: string
          video_link?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          class_id: string
          created_at: string
          file_link: string
          id: string
          subject_id: string
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          file_link: string
          id: string
          subject_id: string
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          file_link?: string
          id?: string
          subject_id?: string
          title?: string
        }
        Relationships: []
      }
      observations: {
        Row: {
          entries: Json
          month: string
          student_id: string
          updated_at: string
        }
        Insert: {
          entries?: Json
          month: string
          student_id: string
          updated_at?: string
        }
        Update: {
          entries?: Json
          month?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule: {
        Row: {
          class_id: string
          created_at: string
          day: string
          id: string
          subject: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day: string
          id: string
          subject: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day?: string
          id?: string
          subject?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class_id: string
          created_at: string
          id: string
          name: string
          pin: string
          status: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id: string
          name: string
          pin: string
          status: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          pin?: string
          status?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id: string
          name: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          class_ids: Json
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          class_ids?: Json
          code: string
          created_at?: string
          id: string
          name: string
        }
        Update: {
          class_ids?: Json
          code?: string
          created_at?: string
          id?: string
          name?: string
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
