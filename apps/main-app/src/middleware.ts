import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Redirect root path to homepage
  if (path === '/') {
    return NextResponse.redirect(new URL('/homepage', request.url));
  }

  // Allow access to all routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/my-portfolio/:path*', '/dashboard/:path*', '/homepage'],
};
