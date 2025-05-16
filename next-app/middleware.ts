import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/auth'];
// List of API routes that should be accessible without authentication
const publicApiRoutes = ['/api/health', '/api/scrape', '/api/predict'];
// List of static asset file extensions to skip middleware processing
const staticExtensions = ['.js', '.css', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    // Get the current pathname
    const { pathname } = req.nextUrl;
    
    // Skip middleware for static assets and resources
    if (staticExtensions.some(ext => pathname.endsWith(ext)) || 
        pathname.startsWith('/_next/') || 
        pathname.startsWith('/favicon.ico')) {
      return res;
    }
    
    // Create Supabase client
    const supabase = createMiddlewareClient({ req, res });
    
    // Check if this is an API route
    const isApiRoute = pathname.startsWith('/api/');
    
    // Allow access to public API routes regardless of authentication status
    if (isApiRoute && publicApiRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
      return res;
    }
    
    // Try to get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Allow access to public routes regardless of authentication status
    // if (publicRoutes.some(route => pathname === route || pathname === `${route}/`)) {
    //   // If user is already authenticated and trying to access auth page, redirect to dashboard
    //   if (session && pathname === '/auth') {
    //     return NextResponse.redirect(new URL('/dashboard', req.url));
    //   }
    //   return res;
    // }
    
    // // If user is not authenticated and trying to access a protected route, redirect to auth page
    // if (!session) {
    //   // For API routes, return 401 Unauthorized
    //   if (isApiRoute) {
    //     return new NextResponse(
    //       JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
    //       { status: 401, headers: { 'Content-Type': 'application/json' } }
    //     );
    //   }
      
    //   // For regular routes, redirect to auth page
    //   return NextResponse.redirect(new URL('/auth', req.url));
    // }
    
    // User is authenticated and accessing a protected route, allow
    return res;
  } catch (error) {
    // If there's an error in the middleware, log it and allow the request to continue
    console.error('Middleware error:', error);
    return res;
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next (internal Next.js routes)
     * - favicon.ico (favicon file)
     * - public files with extensions (e.g. images, fonts, etc)
     */
    '/((?!_next/static|_next/image|_next/webpack|chunks|static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}; 