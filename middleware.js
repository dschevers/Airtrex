import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!api/auth/validate|login|_next/static|_next/image|favicon.ico|images).*)'],
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip auth check for public routes
  const publicPaths = ['/login', '/api/auth/validate', '/api/auth/csrf', '/api/auth/logout'];
  
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('airtrex-auth-token')?.value;
  if (!token) {
    // No token found - redirect to login
    // Use absolute URL to ensure proper redirection in all environments
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // In middleware, we can only check if the token exists
  // The actual validation will happen in your API routes or pages
  return NextResponse.next();
}