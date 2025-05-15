-- This function creates the profiles table if it doesn't exist
-- It should be added as a PostgreSQL function in your Supabase project
CREATE OR REPLACE FUNCTION create_profiles_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Using security definer to allow this to be run by any authenticated user
AS $$
BEGIN
  -- Check if the profiles table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    -- Create the profiles table
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable Row Level Security
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Users can view their own profiles" 
      ON public.profiles 
      FOR SELECT 
      USING (auth.uid() = id);
    
    CREATE POLICY "Users can update their own profiles" 
      ON public.profiles 
      FOR UPDATE 
      USING (auth.uid() = id);
    
    CREATE POLICY "Users can insert their own profiles" 
      ON public.profiles 
      FOR INSERT 
      WITH CHECK (auth.uid() = id);
  END IF;
END;
$$; 