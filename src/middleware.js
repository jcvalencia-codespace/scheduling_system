import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Add paths that don't require authentication
const publicPaths = ['/login', '/forgot-password']

export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Get session cookie
  const sessionCookie = request.cookies.get('schednu-session')
  const isAuthenticated = !!sessionCookie?.value

  // Allow access to public paths even when logged out
  if (publicPaths.includes(pathname)) {
    // If user is already logged in and tries to access login page, redirect to home
    if (isAuthenticated && pathname === '/login') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
    return NextResponse.next()
  }

  // Check if user is logged in
  if (!isAuthenticated) {
    // Redirect to login if accessing protected route while logged out
    const response = NextResponse.redirect(new URL('/login', request.url))
    return response
  }

  // User is authenticated, allow access to protected routes
  return NextResponse.next()
}

// Configure paths that should be checked by middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
