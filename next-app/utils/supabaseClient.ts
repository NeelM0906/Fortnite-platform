import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials from .env.local
const supabaseUrl = "https://ryuxysblsdqxjiagwhci.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dXh5c2Jsc2RxeGppYWd3aGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjkxOTQsImV4cCI6MjA2Mjc0NTE5NH0.GixzXyUlTk1BinFC8hBYrVfN7hdqESx44qNPvo5bON4";

// Export a singleton Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'fortnite-analyzer-auth',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'fortnite-analyzer'
    }
  }
});

// SQL for creating profiles table
const CREATE_PROFILES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create security policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profiles
CREATE POLICY "Users can view their own profiles"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profiles
CREATE POLICY "Users can update their own profiles"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
  
-- Allow users to insert their own profiles
CREATE POLICY "Users can insert their own profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
`;

// Function to initialize the profiles table
export const initializeProfilesTable = async () => {
  try {
    // Only users with the service_role key can execute raw SQL
    // Since we're using the anon key, we'll create the table via RPC if needed
    const { data: tableExists, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (checkError && checkError.code === 'PGRST109') {
      // Table doesn't exist, so we'll create it via the Supabase API
      console.log('Profiles table does not exist. Creating it...');
      
      // Create the profiles table
      await supabase.rpc('create_profiles_table');
      
      console.log('Profiles table created successfully');
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize profiles table:', error);
    return { success: false, error };
  }
};

// Helper function to get user session
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('Session fetch error:', error.message);
      return { session: null, error };
    }
    return { session: data.session, error: null };
  } catch (err) {
    console.log('Session fetch exception:', err);
    return { session: null, error: err };
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { session, error } = await getSession();
    return !!session && !error;
  } catch (err) {
    console.log('Auth check error:', err);
    return false;
  }
};

// Helper function to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('Sign out error:', error.message);
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err) {
    console.log('Sign out exception:', err);
    return { success: false, error: err };
  }
}; 