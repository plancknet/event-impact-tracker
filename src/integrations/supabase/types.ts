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
      alert_news_results: {
        Row: {
          created_at: string
          id: string
          is_duplicate: boolean
          link_url: string | null
          published_at: string | null
          query_result_id: string
          snippet: string | null
          source_raw: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_duplicate?: boolean
          link_url?: string | null
          published_at?: string | null
          query_result_id: string
          snippet?: string | null
          source_raw?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_duplicate?: boolean
          link_url?: string | null
          published_at?: string | null
          query_result_id?: string
          snippet?: string | null
          source_raw?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_news_results_query_result_id_fkey"
            columns: ["query_result_id"]
            isOneToOne: false
            referencedRelation: "alert_query_results"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_query_results: {
        Row: {
          content_language: string
          id: string
          queried_at: string
          raw_html: string | null
          status: string
          term_id: string
        }
        Insert: {
          content_language?: string
          id?: string
          queried_at?: string
          raw_html?: string | null
          status?: string
          term_id: string
        }
        Update: {
          content_language?: string
          id?: string
          queried_at?: string
          raw_html?: string | null
          status?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_query_results_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "search_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      full_news_content: {
        Row: {
          content_full: string | null
          error_message: string | null
          extractor: string | null
          fetched_at: string
          final_url: string | null
          id: string
          news_id: string
          source_url: string | null
          status: string
        }
        Insert: {
          content_full?: string | null
          error_message?: string | null
          extractor?: string | null
          fetched_at?: string
          final_url?: string | null
          id?: string
          news_id: string
          source_url?: string | null
          status?: string
        }
        Update: {
          content_full?: string | null
          error_message?: string | null
          extractor?: string | null
          fetched_at?: string
          final_url?: string | null
          id?: string
          news_id?: string
          source_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "full_news_content_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "alert_news_results"
            referencedColumns: ["id"]
          },
        ]
      }
      news_ai_analysis: {
        Row: {
          ai_model: string
          analyzed_at: string
          categories: string | null
          confidence_score: number | null
          full_content_id: string
          id: string
          impact_asset_class: string | null
          impact_direction: string | null
          model_variables_json: string | null
          news_id: string
          raw_ai_response: string | null
          region: string | null
          selected_for_model: boolean
          summary: string | null
        }
        Insert: {
          ai_model?: string
          analyzed_at?: string
          categories?: string | null
          confidence_score?: number | null
          full_content_id: string
          id?: string
          impact_asset_class?: string | null
          impact_direction?: string | null
          model_variables_json?: string | null
          news_id: string
          raw_ai_response?: string | null
          region?: string | null
          selected_for_model?: boolean
          summary?: string | null
        }
        Update: {
          ai_model?: string
          analyzed_at?: string
          categories?: string | null
          confidence_score?: number | null
          full_content_id?: string
          id?: string
          impact_asset_class?: string | null
          impact_direction?: string | null
          model_variables_json?: string | null
          news_id?: string
          raw_ai_response?: string | null
          region?: string | null
          selected_for_model?: boolean
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_ai_analysis_full_content_id_fkey"
            columns: ["full_content_id"]
            isOneToOne: false
            referencedRelation: "full_news_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_ai_analysis_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "alert_news_results"
            referencedColumns: ["id"]
          },
        ]
      }
      search_terms: {
        Row: {
          collection_date: string | null
          created_at: string
          id: string
          main_area: string | null
          term: string
        }
        Insert: {
          collection_date?: string | null
          created_at?: string
          id?: string
          main_area?: string | null
          term: string
        }
        Update: {
          collection_date?: string | null
          created_at?: string
          id?: string
          main_area?: string | null
          term?: string
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
        }
        Insert: {
          created_at?: string
          id?: string
          news_ids_json: Json
          parameters_json: Json
          raw_ai_response?: string | null
          script_text: string
        }
        Update: {
          created_at?: string
          id?: string
          news_ids_json?: Json
          parameters_json?: Json
          raw_ai_response?: string | null
          script_text?: string
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
