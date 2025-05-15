# Supabase Database Setup for Fortnite Analyzer

This document explains how to set up the Supabase database for the Fortnite Analyzer application.

## Required Setup

The Fortnite Analyzer requires a Supabase project with:
1. Authentication enabled
2. A `profiles` table that stores user profile information

## Automatic Setup

The application will attempt to create the required database tables automatically. If it fails, you'll need to set them up manually using the SQL provided in this document.

## Manual Setup

### 1. Create the Profiles Table

Run the following SQL in your Supabase SQL Editor:

```sql
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
```

### 2. Create the Helper Function (Optional)

To enable automatic table creation, create the following helper function:

```sql
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
```

## Troubleshooting

If you see the error message "Profile updated locally (profiles table doesn't exist)", it means:
1. The profiles table doesn't exist in your Supabase database
2. The app is storing your profile data locally only (changes will be lost on refresh)

To fix this issue:
1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run the SQL provided in this document to create the profiles table
4. Refresh your Fortnite Analyzer application 