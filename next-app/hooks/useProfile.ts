import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

interface ProfileData {
  display_name: string;
  bio: string;
}

interface UseProfileProps {
  userId: string;
  onError?: (message: string) => void;
}

export default function useProfile({ userId, onError }: UseProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tableStatus, setTableStatus] = useState<'unknown' | 'exists' | 'missing'>('unknown');

  // Check if the profiles table exists and try to create it if needed
  useEffect(() => {
    checkProfilesTable();
  }, []);

  // Fetch profile on mount or when table status changes
  useEffect(() => {
    if (userId && tableStatus === 'exists') {
      fetchProfile();
    } else if (userId && tableStatus === 'missing') {
      // Create default profile in local state if table doesn't exist
      setProfile({
        id: userId,
        display_name: '',
        bio: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setIsLoading(false);
    }
  }, [userId, tableStatus]);

  // Check if profiles table exists and try to create it
  const checkProfilesTable = async () => {
    try {
      // First, check if table exists
      const { error: checkError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (!checkError) {
        setTableStatus('exists');
        return;
      }

      // Table doesn't exist, try to create it
      const response = await fetch('/api/init-db', {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (data.tables.profiles) {
        setTableStatus('exists');
      } else {
        // Try to create the table
        const createResponse = await fetch('/api/init-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'fortnite-analyzer-setup' })
        });
        
        const createData = await createResponse.json();
        
        if (createData.success || createData.tablesExist?.profiles) {
          setTableStatus('exists');
        } else {
          console.error('Failed to create profiles table:', createData);
          setTableStatus('missing');
        }
      }
    } catch (err) {
      console.error('Error checking profiles table:', err);
      setTableStatus('missing');
    }
  };

  // Fetch profile data from Supabase
  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch the user's profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') { // Code for "no rows returned" - expected for new users
          // Create default profile state
          setProfile({
            id: userId,
            display_name: '',
            bio: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          throw error;
        }
      } else if (data) {
        setProfile(data);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load profile';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile in Supabase
  const updateProfile = async (profileData: ProfileData): Promise<boolean> => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      if (tableStatus === 'missing') {
        // Table doesn't exist, try to create it one more time
        await checkProfilesTable();
      }
      
      if (tableStatus === 'missing') {
        // Still no table, update local state only
        setProfile({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        });
        setSuccessMessage('Profile updated locally (profiles table doesn\'t exist in Supabase)');
        console.warn('Using local profile state because profiles table doesn\'t exist.');
        console.info('Run this SQL in your Supabase dashboard to create the profiles table:', `
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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
        `);
        
        return true;
      }
      
      // Validation check
      if (!userId) {
        const noUserIdError = 'No user ID provided for profile update';
        console.error(noUserIdError);
        setError(noUserIdError);
        if (onError) onError(noUserIdError);
        return false;
      }
      
      // Update the profile
      const updates = {
        id: userId,
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        updated_at: new Date().toISOString()
      };
      
      console.log('Attempting to update profile with data:', updates);
      
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(updates, { 
          onConflict: 'id'
        });
        
      if (upsertError) {
        console.error('Supabase upsert error:', upsertError);
        
        // Try insert if upsert failed - this might be necessary for first-time profiles
        if (upsertError.code === '23505' || upsertError.message.includes('duplicate')) {
          console.log('Upsert failed, trying update instead');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              display_name: profileData.display_name || '',
              bio: profileData.bio || '',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Supabase update error:', updateError);
            throw updateError;
          }
        } else {
          // If it wasn't a conflict error, try insert as a fallback
          console.log('Trying insert as fallback');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              display_name: profileData.display_name || '',
              bio: profileData.bio || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('Supabase insert error:', insertError);
            throw insertError;
          }
        }
      }
      
      // Update was successful, update local state
      setProfile({
        ...profile,
        ...updates
      });
      
      setSuccessMessage('Profile updated successfully!');
      return true;
    } catch (err: any) {
      console.error('Profile update detailed error:', err);
      const errorMessage = err.message || 'Failed to update profile';
      const detailedError = err.details || err.hint || '';
      
      setError(`${errorMessage}${detailedError ? ': ' + detailedError : ''}`);
      if (onError) onError(`${errorMessage}${detailedError ? ': ' + detailedError : ''}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    profile,
    isLoading,
    isSaving,
    error,
    successMessage,
    updateProfile,
    fetchProfile,
    tableStatus
  };
} 