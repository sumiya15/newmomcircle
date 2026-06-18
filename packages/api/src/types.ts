// Supabase database type map — keeps all queries type-safe.
// Run `supabase gen types typescript` to auto-regenerate after schema changes.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          photo_url: string | null;
          baby_dob: string | null;
          language: string;
          role: string;
          allow_retraining: boolean;
          gdpr_delete_requested: boolean;
          gdpr_requested_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          photo_url?: string | null;
          baby_dob?: string | null;
          language?: string;
          role?: string;
          allow_retraining?: boolean;
          gdpr_delete_requested?: boolean;
          gdpr_requested_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          photo_url?: string | null;
          baby_dob?: string | null;
          language?: string;
          role?: string;
          allow_retraining?: boolean;
          gdpr_delete_requested?: boolean;
          gdpr_requested_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          author_name: string;
          author_initials: string;
          author_photo_url: string | null;
          content: string;
          image_url: string | null;
          like_count: number;
          comment_count: number;
          liked_by: string[];
          is_anonymous: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          author_name: string;
          author_initials: string;
          author_photo_url?: string | null;
          content: string;
          image_url?: string | null;
          like_count?: number;
          comment_count?: number;
          liked_by?: string[];
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          author_name?: string;
          author_initials?: string;
          author_photo_url?: string | null;
          content?: string;
          image_url?: string | null;
          like_count?: number;
          comment_count?: number;
          liked_by?: string[];
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          author_name: string;
          author_initials: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          author_name: string;
          author_initials: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          author_name?: string;
          author_initials?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          mood: string | null;
          word_count: number;
          language: string;
          sentiment: string | null;
          sentiment_score: number | null;
          sentiment_advice: string | null;
          suggested_coping: string | null;
          allow_retraining: boolean;
          analyzed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          mood?: string | null;
          word_count: number;
          language?: string;
          sentiment?: string | null;
          sentiment_score?: number | null;
          sentiment_advice?: string | null;
          suggested_coping?: string | null;
          allow_retraining?: boolean;
          analyzed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          mood?: string | null;
          word_count?: number;
          language?: string;
          sentiment?: string | null;
          sentiment_score?: number | null;
          sentiment_advice?: string | null;
          suggested_coping?: string | null;
          allow_retraining?: boolean;
          analyzed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      guardians: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          relationship: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
          relationship: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string;
          relationship?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          title: string;
          content: string;
          image_url: string | null;
          category: string;
          language: string;
          submitted_by: string;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          image_url?: string | null;
          category: string;
          language: string;
          submitted_by: string;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          image_url?: string | null;
          category?: string;
          language?: string;
          submitted_by?: string;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sos_events: {
        Row: {
          id: string;
          user_id: string;
          triggered_at: string;
          recipient_count: number;
          method: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          triggered_at?: string;
          recipient_count: number;
          method: string;
          status: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          triggered_at?: string;
          recipient_count?: number;
          method?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      toolbox_progress: {
        Row: {
          id: string;
          user_id: string;
          toolbox_id: string;
          status: string;
          completed_at: string | null;
          last_updated: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          toolbox_id: string;
          status: string;
          completed_at?: string | null;
          last_updated?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          toolbox_id?: string;
          status?: string;
          completed_at?: string | null;
          last_updated?: string;
        };
        Relationships: [];
      };
      mentor_requests: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          message: string;
          status: string;
          mentor_id: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
          message: string;
          status?: string;
          mentor_id?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string;
          message?: string;
          status?: string;
          mentor_id?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
