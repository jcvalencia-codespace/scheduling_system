import { NextResponse } from 'next/server'
import { unsealData } from 'iron-session'
import { sessionOptions } from '@/lib/iron-config'
import { hasPermission } from '@/utils/rbac'

// Add paths that don't require authentication
const publicPaths = ['/login', '/forgot-password', '/unauthorized']

export async function middleware(request) {
  // Allow WebSocket connections without authentication
  if (request.headers.get('upgrade') === 'websocket') {
    return NextResponse.next();
  }

  // Allow socket.io polling without authentication
  if (request.nextUrl.pathname.startsWith('/api/socket')) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl

  // Get session cookie
  const sessionCookie = request.cookies.get(sessionOptions.cookieName)
  
  // Allow access to public paths even when logged out
  if (publicPaths.includes(pathname)) {
    if (sessionCookie?.value) {
      try {
        const session = await unsealData(sessionCookie.value, {
          password: sessionOptions.password
        })
        // If user is already logged in and tries to access login page, redirect to home
        if (session.user && pathname === '/login') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (error) {
        // Invalid session, continue as unauthenticated
      }
    }
    return NextResponse.next()
  }

  // Verify authentication
  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Unseal and verify the session data
    const session = await unsealData(sessionCookie.value, {
      password: sessionOptions.password
    })

    if (!session.user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect faculty users trying to access dashboard to faculty schedules
    if (session.user.role === 'Faculty' && pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/schedules/faculty', request.url))
    }

    // Add Faculty-specific redirect for archive
    if (session.user.role === 'Faculty' && pathname === '/schedule-archive') {
      return NextResponse.redirect(new URL('/schedule-archive/faculty', request.url))
    }

    // Add Faculty-specific redirect
    if (session.user.role === 'Faculty' && pathname === '/schedules') {
      return NextResponse.redirect(new URL('/schedules/faculty', request.url))
    }

    // Check if user has permission to access the route
    if (!hasPermission(session.user.role, pathname)) {
      // Redirect to unauthorized page if user doesn't have permission
      const returnUrl = encodeURIComponent(pathname)
      return NextResponse.redirect(new URL(`/unauthorized?returnUrl=${returnUrl}`, request.url))
    }

    // User is authenticated and authorized
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // Invalid session, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// Configure paths that should be checked by middleware
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/api/:path*'
  ]
};
