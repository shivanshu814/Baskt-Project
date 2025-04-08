import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('wallet-connected')?.value || '';

  // Redirect root path to homepage
  if (path === '/') {
    return NextResponse.redirect(new URL('/homepage', request.url));
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/my-portfolio', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

  // Only redirect to login for protected routes
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow access to all other routes including homepage
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/my-portfolio/:path*', '/dashboard/:path*', '/homepage', '/login'],
};
