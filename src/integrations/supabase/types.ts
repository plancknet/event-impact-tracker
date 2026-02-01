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
      creator_profiles: {
        Row: {
          audience_pain_points: string[] | null
          audience_type: string
          content_goal: string
          created_at: string
          cta_template: string | null
          display_name: string | null
          duration_unit: string
          energy_level: string
          expertise_level: string
          id: string
          include_cta: boolean
          main_topic: string
          news_language: string
          platform: string
          script_language: string
          speaking_tone: string
          target_duration: string
          updated_at: string
          user_id: string
          video_type: string
        }
        Insert: {
          audience_pain_points?: string[] | null
          audience_type?: string
          content_goal?: string
          created_at?: string
          cta_template?: string | null
          display_name?: string | null
          duration_unit?: string
          energy_level?: string
          expertise_level?: string
          id?: string
          include_cta?: boolean
          main_topic?: string
          news_language?: string
          platform?: string
          script_language?: string
          speaking_tone?: string
          target_duration?: string
          updated_at?: string
          user_id: string
          video_type?: string
        }
        Update: {
          audience_pain_points?: string[] | null
          audience_type?: string
          content_goal?: string
          created_at?: string
          cta_template?: string | null
          display_name?: string | null
          duration_unit?: string
          energy_level?: string
          expertise_level?: string
          id?: string
          include_cta?: boolean
          main_topic?: string
          news_language?: string
          platform?: string
          script_language?: string
          speaking_tone?: string
          target_duration?: string
          updated_at?: string
          user_id?: string
          video_type?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          age_range: string | null
          answer_timestamps: Json | null
          audience_age: string | null
          audience_gender: string | null
          audience_type: string | null
          biggest_challenge: string | null
          comfort_recording: string | null
          completed_at: string | null
          content_goal: string | null
          coupon_code: string | null
          coupon_revealed: boolean | null
          created_at: string
          creator_level: string | null
          device_info: Json | null
          editing_time: string | null
          email: string | null
          energy_level: string | null
          id: string
          main_goal: string | null
          niche: string | null
          planning_style: string | null
          platforms: string[] | null
          publish_frequency: string | null
          reached_results: boolean | null
          result_goal: string | null
          session_started_at: string | null
          speaking_tone: string | null
          updated_at: string
          user_id: string | null
          video_duration: string | null
          video_format: string | null
        }
        Insert: {
          age_range?: string | null
          answer_timestamps?: Json | null
          audience_age?: string | null
          audience_gender?: string | null
          audience_type?: string | null
          biggest_challenge?: string | null
          comfort_recording?: string | null
          completed_at?: string | null
          content_goal?: string | null
          coupon_code?: string | null
          coupon_revealed?: boolean | null
          created_at?: string
          creator_level?: string | null
          device_info?: Json | null
          editing_time?: string | null
          email?: string | null
          energy_level?: string | null
          id?: string
          main_goal?: string | null
          niche?: string | null
          planning_style?: string | null
          platforms?: string[] | null
          publish_frequency?: string | null
          reached_results?: boolean | null
          result_goal?: string | null
          session_started_at?: string | null
          speaking_tone?: string | null
          updated_at?: string
          user_id?: string | null
          video_duration?: string | null
          video_format?: string | null
        }
        Update: {
          age_range?: string | null
          answer_timestamps?: Json | null
          audience_age?: string | null
          audience_gender?: string | null
          audience_type?: string | null
          biggest_challenge?: string | null
          comfort_recording?: string | null
          completed_at?: string | null
          content_goal?: string | null
          coupon_code?: string | null
          coupon_revealed?: boolean | null
          created_at?: string
          creator_level?: string | null
          device_info?: Json | null
          editing_time?: string | null
          email?: string | null
          energy_level?: string | null
          id?: string
          main_goal?: string | null
          niche?: string | null
          planning_style?: string | null
          platforms?: string[] | null
          publish_frequency?: string | null
          reached_results?: boolean | null
          result_goal?: string | null
          session_started_at?: string | null
          speaking_tone?: string | null
          updated_at?: string
          user_id?: string | null
          video_duration?: string | null
          video_format?: string | null
        }
        Relationships: []
      }
      teleprompter_scripts: {
        Row: {
          created_at: string
          id: string
          news_ids_json: Json
          parameters_json: Json
          raw_ai_response: string | null
          script_text: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          news_ids_json: Json
          parameters_json: Json
          raw_ai_response?: string | null
          script_text: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          news_ids_json?: Json
          parameters_json?: Json
          raw_ai_response?: string | null
          script_text?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_news_items: {
        Row: {
          created_at: string
          external_id: string | null
          fetched_at: string
          id: string
          language: string | null
          link: string | null
          published_at: string | null
          source: string | null
          summary: string | null
          title: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          fetched_at?: string
          id?: string
          language?: string | null
          link?: string | null
          published_at?: string | null
          source?: string | null
          summary?: string | null
          title: string
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          fetched_at?: string
          id?: string
          language?: string | null
          link?: string | null
          published_at?: string | null
          source?: string | null
          summary?: string | null
          title?: string
          topic?: string
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
