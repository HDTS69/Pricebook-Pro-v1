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

// Helper function to sync user data with profiles table
export async function syncUserProfile(
  userId: string, 
  userData: { 
    name?: string; 
    company?: string; 
    phone_number?: string; 
    role?: string;
  }
) {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const now = new Date().toISOString();
    
    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.name || existingProfile.full_name,
          company: userData.company || existingProfile.company,
          phone_number: userData.phone_number || existingProfile.phone_number,
          role: userData.role || existingProfile.role,
          updated_at: now
        })
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      // Create new profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: userData.name || '',
          company: userData.company || null,
          phone_number: userData.phone_number || null,
          role: userData.role || 'User',
          created_at: now,
          updated_at: now
        });
      
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error syncing user profile:', error);
    return { success: false, error };
  }
}

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
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          company: string | null
          phone_number: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          company?: string | null
          phone_number?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          company?: string | null
          phone_number?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          mobile_phone: string | null
          billing_address: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          mobile_phone?: string | null
          billing_address?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          mobile_phone?: string | null
          billing_address?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          quote_number: string
          sequence_number: number
          name: string | null
          customer_id: string
          status: 'Draft' | 'Sent' | 'Accepted' | 'Declined'
          selected_tier_id: string | null
          total_price: number
          created_at: string
          updated_at: string
          sent_at: string | null
          accepted_at: string | null
        }
        Insert: {
          id?: string
          quote_number: string
          sequence_number: number
          name?: string | null
          customer_id: string
          status?: 'Draft' | 'Sent' | 'Accepted' | 'Declined'
          selected_tier_id?: string | null
          total_price?: number
          created_at?: string
          updated_at?: string
          sent_at?: string | null
          accepted_at?: string | null
        }
        Update: {
          id?: string
          quote_number?: string
          sequence_number?: number
          name?: string | null
          customer_id?: string
          status?: 'Draft' | 'Sent' | 'Accepted' | 'Declined'
          selected_tier_id?: string | null
          total_price?: number
          created_at?: string
          updated_at?: string
          sent_at?: string | null
          accepted_at?: string | null
        }
      }
      quote_tasks: {
        Row: {
          id: string
          quote_id: string
          tier_id: string
          task_id: string | null
          original_service_id: string | null
          name: string
          description: string | null
          base_price: number
          quantity: number
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          tier_id: string
          task_id?: string | null
          original_service_id?: string | null
          name: string
          description?: string | null
          base_price: number
          quantity?: number
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          tier_id?: string
          task_id?: string | null
          original_service_id?: string | null
          name?: string
          description?: string | null
          base_price?: number
          quantity?: number
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quote_task_addons: {
        Row: {
          id: string
          quote_task_id: string
          name: string
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_task_id: string
          name: string
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_task_id?: string
          name?: string
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      quote_adjustments: {
        Row: {
          id: string
          quote_id: string
          description: string
          amount: number
          type: 'fixed' | 'percentage'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          description: string
          amount: number
          type: 'fixed' | 'percentage'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          description?: string
          amount?: number
          type?: 'fixed' | 'percentage'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      quote_details: {
        Row: {
          id: string
          quoteNumber: string
          sequenceNumber: number
          name: string | null
          customerId: string
          customerName: string
          status: 'Draft' | 'Sent' | 'Accepted' | 'Declined'
          selectedTierId: string | null
          totalPrice: number
          createdAt: string
          updatedAt: string
          sentAt: string | null
          acceptedAt: string | null
        }
      }
      customer_stats: {
        Row: {
          customerId: string
          customerName: string
          totalQuotes: number
          lastQuoteDate: string | null
        }
      }
      quote_tasks_with_addons: {
        Row: {
          id: string
          quoteId: string
          tierId: string
          taskId: string | null
          originalServiceId: string | null
          name: string
          description: string | null
          basePrice: number
          quantity: number
          category: string | null
          addons: Json
        }
      }
    }
  }
} 