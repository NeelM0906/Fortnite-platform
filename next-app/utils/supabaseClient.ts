import { createClient } from '@supabase/supabase-js';

// Read from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Export a singleton Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 