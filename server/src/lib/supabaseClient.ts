import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const supabaseUrl: string | undefined = process.env.SUPABASE_URL;
const supabaseAnonKey: string | undefined = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables.');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 