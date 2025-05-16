import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // For handling authentication callback operations if needed
  // This route can be used for additional auth operations if required
  return NextResponse.json({ message: 'Auth API route' })
}

export async function POST(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { action, email } = await request.json()
    
    // Handle magic link authentication
    if (action === 'magic-link' && email) {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // The link expires in 24 hours
          emailRedirectTo: `${requestUrl.origin}/auth`,
        },
      })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Magic link sent successfully',
      })
    }
    
    // Handle other authentication actions as needed
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 