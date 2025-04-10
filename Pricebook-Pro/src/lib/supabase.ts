import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Please add it to your .env file.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Please add it to your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
  },
  global: {
    headers: {
      'x-application-name': 'pricebook-pro',
    },
  },
});

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          email: string
          role: 'admin' | 'technician'
          name: string
          created_at: string
        }
        Insert: {
          email: string
          role: 'admin' | 'technician'
          name: string
        }
        Update: {
          email?: string
          role?: 'admin' | 'technician'
          name?: string
        }
      }
      tasks: {
        Row: {
          id: number
          category: string
          subcategory: string
          code: string
          description: string
          base_price: number
          notes: string | null
          created_at: string
          created_by: number
        }
        Insert: {
          category: string
          subcategory: string
          code: string
          description: string
          base_price: number
          notes?: string
          created_by: number
        }
        Update: {
          category?: string
          subcategory?: string
          code?: string
          description?: string
          base_price?: number
          notes?: string
        }
      }
      quotes: {
        Row: {
          id: number
          customer_id: number
          tier_id: number
          total_price: number
          status: 'draft' | 'sent' | 'accepted' | 'declined' | 'completed'
          created_at: string
          created_by: number
        }
        Insert: {
          customer_id: number
          tier_id: number
          total_price: number
          status: 'draft' | 'sent' | 'accepted' | 'declined' | 'completed'
          created_by: number
        }
        Update: {
          tier_id?: number
          total_price?: number
          status?: 'draft' | 'sent' | 'accepted' | 'declined' | 'completed'
        }
      }
    }
  }
} 