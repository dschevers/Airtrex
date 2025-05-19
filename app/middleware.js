// app/middleware.js
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!api/auth/validate|login|_next/static|_next/image|favicon.ico|images).*)'],
};

export async function middleware(request) {
  // Skip auth check for public routes
  const publicPaths = ['/login', '/api/auth/validate', '/api/auth/csrf', '/api/auth/logout'];
  const path = request.nextUrl.pathname;
  
  if (
    publicPaths.includes(path) ||
    path.startsWith('/_next/') ||
    path.startsWith('/images/') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('airtrex-auth-token')?.value;
  if (!token) {
    // No token found - redirect to login
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // In middleware, we can only check if the token exists
  // The actual validation will happen in your API routes or pages
  return NextResponse.next();
}