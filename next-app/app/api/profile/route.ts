import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/profile
 * Retrieves the current user's profile data
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'You must be logged in to access your profile'
      }, { status: 401 });
    }
    
    // Get profile data
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found for this user, return empty profile
        return NextResponse.json({
          id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          bio: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      console.error('Profile fetch error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        message: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Profile API error:', err);
    return NextResponse.json({ 
      error: 'Server error', 
      message: err.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * POST /api/profile
 * Updates the current user's profile data
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the profile data from the request
    const profileData = await req.json();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'You must be logged in to update your profile'
      }, { status: 401 });
    }
    
    // Validate data
    if (!profileData.display_name) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        message: 'Display name is required'
      }, { status: 400 });
    }
    
    if (profileData.bio && profileData.bio.length > 200) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        message: 'Bio must be 200 characters or less'
      }, { status: 400 });
    }
    
    // Build update object
    const updates = {
      id: user.id,
      display_name: profileData.display_name,
      bio: profileData.bio || '',
      updated_at: new Date().toISOString()
    };
    
    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .upsert(updates, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        message: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data
    });
  } catch (err: any) {
    console.error('Profile API error:', err);
    return NextResponse.json({ 
      error: 'Server error', 
      message: err.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
