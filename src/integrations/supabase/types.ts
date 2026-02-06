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
          has_license: boolean
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
          has_license?: boolean
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
          has_license?: boolean
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
      lastlink_events: {
        Row: {
          buyer_email: string
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          lastlink_event_id: string
          payload: Json
          processed: boolean
        }
        Insert: {
          buyer_email: string
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          lastlink_event_id: string
          payload: Json
          processed?: boolean
        }
        Update: {
          buyer_email?: string
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          lastlink_event_id?: string
          payload?: Json
          processed?: boolean
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          age_range: string | null
          age_range_at: string | null
          audience_age: string | null
          audience_age_at: string | null
          audience_gender: string | null
          audience_gender_at: string | null
          audience_type: string | null
          audience_type_at: string | null
          biggest_challenge: string | null
          biggest_challenge_at: string | null
          comfort_recording: string | null
          comfort_recording_at: string | null
          completed_at: string | null
          content_goal: string | null
          content_goal_at: string | null
          coupon_code: string | null
          coupon_revealed: boolean | null
          coupon_revealed_at: string | null
          created_at: string
          creator_level: string | null
          creator_level_at: string | null
          editing_time: string | null
          editing_time_at: string | null
          email: string | null
          energy_level: string | null
          energy_level_at: string | null
          gender: string | null
          gender_at: string | null
          id: string
          main_goal: string | null
          main_goal_at: string | null
          niche: string | null
          niche_at: string | null
          planning_style: string | null
          planning_style_at: string | null
          platforms: string[] | null
          platforms_at: string | null
          reached_results: boolean | null
          session_started_at: string | null
          speaking_tone: string | null
          speaking_tone_at: string | null
          transition_complete_at: string | null
          updated_at: string
          user_id: string | null
          video_duration: string | null
          video_duration_at: string | null
          video_format: string | null
          video_format_at: string | null
        }
        Insert: {
          age_range?: string | null
          age_range_at?: string | null
          audience_age?: string | null
          audience_age_at?: string | null
          audience_gender?: string | null
          audience_gender_at?: string | null
          audience_type?: string | null
          audience_type_at?: string | null
          biggest_challenge?: string | null
          biggest_challenge_at?: string | null
          comfort_recording?: string | null
          comfort_recording_at?: string | null
          completed_at?: string | null
          content_goal?: string | null
          content_goal_at?: string | null
          coupon_code?: string | null
          coupon_revealed?: boolean | null
          coupon_revealed_at?: string | null
          created_at?: string
          creator_level?: string | null
          creator_level_at?: string | null
          editing_time?: string | null
          editing_time_at?: string | null
          email?: string | null
          energy_level?: string | null
          energy_level_at?: string | null
          gender?: string | null
          gender_at?: string | null
          id?: string
          main_goal?: string | null
          main_goal_at?: string | null
          niche?: string | null
          niche_at?: string | null
          planning_style?: string | null
          planning_style_at?: string | null
          platforms?: string[] | null
          platforms_at?: string | null
          reached_results?: boolean | null
          session_started_at?: string | null
          speaking_tone?: string | null
          speaking_tone_at?: string | null
          transition_complete_at?: string | null
          updated_at?: string
          user_id?: string | null
          video_duration?: string | null
          video_duration_at?: string | null
          video_format?: string | null
          video_format_at?: string | null
        }
        Update: {
          age_range?: string | null
          age_range_at?: string | null
          audience_age?: string | null
          audience_age_at?: string | null
          audience_gender?: string | null
          audience_gender_at?: string | null
          audience_type?: string | null
          audience_type_at?: string | null
          biggest_challenge?: string | null
          biggest_challenge_at?: string | null
          comfort_recording?: string | null
          comfort_recording_at?: string | null
          completed_at?: string | null
          content_goal?: string | null
          content_goal_at?: string | null
          coupon_code?: string | null
          coupon_revealed?: boolean | null
          coupon_revealed_at?: string | null
          created_at?: string
          creator_level?: string | null
          creator_level_at?: string | null
          editing_time?: string | null
          editing_time_at?: string | null
          email?: string | null
          energy_level?: string | null
          energy_level_at?: string | null
          gender?: string | null
          gender_at?: string | null
          id?: string
          main_goal?: string | null
          main_goal_at?: string | null
          niche?: string | null
          niche_at?: string | null
          planning_style?: string | null
          planning_style_at?: string | null
          platforms?: string[] | null
          platforms_at?: string | null
          reached_results?: boolean | null
          session_started_at?: string | null
          speaking_tone?: string | null
          speaking_tone_at?: string | null
          transition_complete_at?: string | null
          updated_at?: string
          user_id?: string | null
          video_duration?: string | null
          video_duration_at?: string | null
          video_format?: string | null
          video_format_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_email: { Args: { _email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
