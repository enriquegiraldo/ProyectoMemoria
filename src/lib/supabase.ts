import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para las tablas de Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'ADMIN' | 'FAMILIAR' | 'AMIGO' | 'INVITADO';
          profile: any;
          page_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'ADMIN' | 'FAMILIAR' | 'AMIGO' | 'INVITADO';
          profile?: any;
          page_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'ADMIN' | 'FAMILIAR' | 'AMIGO' | 'INVITADO';
          profile?: any;
          page_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      memories: {
        Row: {
          id: string;
          title: string;
          description: string;
          media_url: string;
          media_type: 'IMAGE' | 'VIDEO' | 'AUDIO';
          author_id: string;
          page_id: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          media_url: string;
          media_type: 'IMAGE' | 'VIDEO' | 'AUDIO';
          author_id: string;
          page_id: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          media_url?: string;
          media_type?: 'IMAGE' | 'VIDEO' | 'AUDIO';
          author_id?: string;
          page_id?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          content: string;
          author_id: string;
          memory_id: string;
          parent_comment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          author_id: string;
          memory_id: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          author_id?: string;
          memory_id?: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reactions: {
        Row: {
          id: string;
          type: 'LIKE' | 'HEART' | 'SAD';
          user_id: string;
          reference_id: string;
          reference_type: 'MEMORY' | 'COMMENT';
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'LIKE' | 'HEART' | 'SAD';
          user_id: string;
          reference_id: string;
          reference_type: 'MEMORY' | 'COMMENT';
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'LIKE' | 'HEART' | 'SAD';
          user_id?: string;
          reference_id?: string;
          reference_type?: 'MEMORY' | 'COMMENT';
          created_at?: string;
        };
      };
      pages: {
        Row: {
          id: string;
          owner_id: string;
          template: string;
          qr_code_url: string | null;
          subscription_status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          template: string;
          qr_code_url?: string | null;
          subscription_status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          template?: string;
          qr_code_url?: string | null;
          subscription_status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
