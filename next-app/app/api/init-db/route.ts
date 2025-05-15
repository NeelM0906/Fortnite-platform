import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';

// SQL statements to initialize the database
const initSQL = {
  profiles: `
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profiles'
      ) THEN
        CREATE POLICY "Users can view their own profiles" ON profiles
          FOR SELECT USING (auth.uid() = id);
      END IF;

      IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profiles'
      ) THEN
        CREATE POLICY "Users can update their own profiles" ON profiles
          FOR UPDATE USING (auth.uid() = id);
      END IF;

      IF NOT EXISTS (
        SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profiles'
      ) THEN
        CREATE POLICY "Users can insert their own profiles" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
      END IF;
    END
    $$;
  `
};

/**
 * POST /api/init-db
 * Initializes the database by creating required tables and policies
 * This endpoint requires the service role key to execute raw SQL
 */
export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    
    // Basic security check - in a real app, use a proper API key
    if (key !== 'fortnite-analyzer-setup') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // First check if the profiles table exists
    const { count, error: checkError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (checkError && checkError.code !== 'PGRST109' && !checkError.message.includes('does not exist')) {
      throw new Error(`Error checking profiles table: ${checkError.message}`);
    }
    
    // Table exists if no error or error is not related to missing table
    const tableExists = !checkError || (checkError.code !== 'PGRST109' && !checkError.message.includes('does not exist'));
    
    if (tableExists) {
      return NextResponse.json({
        message: 'Database already initialized',
        tablesExist: { profiles: true }
      });
    }
    
    // For security reasons, we're using Supabase's stored procedures approach
    // In a real app, you would create these procedures in the Supabase dashboard

    // Create a manual upsert for the profile
    const { error: upsertError } = await supabase.rpc('create_profiles_table');
    
    if (upsertError) {
      // If RPC fails, tell the user they need to create this in the Supabase dashboard
      return NextResponse.json({
        message: 'Please create the profiles table in your Supabase dashboard',
        sql: initSQL.profiles,
        error: upsertError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    
    return NextResponse.json({
      error: 'Server error',
      message: error.message,
      hint: 'Please create the profiles table manually in your Supabase dashboard',
      sql: initSQL.profiles
    }, { status: 500 });
  }
}

/**
 * GET /api/init-db
 * Checks if the database is initialized
 */
export async function GET(req: NextRequest) {
  try {
    // Check if profiles table exists
    const { count, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const profilesExist = !profilesError || 
      (profilesError.code !== 'PGRST109' && !profilesError.message.includes('does not exist'));
    
    return NextResponse.json({
      initialized: profilesExist,
      tables: {
        profiles: profilesExist
      }
    });
  } catch (error: any) {
    console.error('Database check error:', error);
    return NextResponse.json({
      error: 'Server error',
      message: error.message
    }, { status: 500 });
  }
} 