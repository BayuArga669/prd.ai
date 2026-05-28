import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;

  const isAuthPage = request.nextUrl.pathname === '/login';
  const isDashboardRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/editor') ||
    request.nextUrl.pathname.startsWith('/templates') ||
    request.nextUrl.pathname.startsWith('/analytics') ||
    request.nextUrl.pathname.startsWith('/wizard');

  // If no token and trying to access dashboard routes, redirect to login
  if (!token && isDashboardRoute) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // If token exists, try to verify it
  if (token) {
    const decoded = verifyToken(token);
    if (!decoded) {
      if (isDashboardRoute) {
        const url = new URL('/login', request.url);
        const response = NextResponse.redirect(url);
        response.cookies.delete('session_token');
        return response;
      }
    } else {
      // Token is valid and active, redirect from login to dashboard
      if (isAuthPage) {
        const url = new URL('/dashboard', request.url);
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/editor/:path*', 
    '/templates/:path*', 
    '/analytics/:path*', 
    '/wizard/:path*', 
    '/login'
  ],
};
