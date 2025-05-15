import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/utils/supabaseClient';

/**
 * GET /api/profile
 * Returns the authenticated user's profile from Supabase Postgres.
 */
export async function GET(req: NextRequest) {
  // Create a Supabase client with the user's cookies
  const supabaseServer = createServerClient({ req, cookies });
  const {
    data: { user },
    error: userError,
  } = await supabaseServer.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  // Fetch profile from 'profiles' table
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ profile: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

/**
 * POST /api/profile
 * Updates the authenticated user's profile in Supabase Postgres.
 * Body: { username?: string, ... }
 */
export async function POST(req: NextRequest) {
  const supabaseServer = createServerClient({ req, cookies });
  const {
    data: { user },
    error: userError,
  } = await supabaseServer.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const body = await req.json();
  // Only allow updating certain fields
  const updateFields: any = {};
  if (body.username) updateFields.username = body.username;
  // Add more fields as needed
  if (Object.keys(updateFields).length === 0) {
    return new Response(JSON.stringify({ error: 'No valid fields to update' }), { status: 400 });
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(updateFields)
    .eq('id', user.id)
    .select()
    .single();
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ profile: data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
