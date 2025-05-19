import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!api/auth/validate|api/auth/csrf|api/auth/logout|login|_next/static|_next/image|favicon.ico|images).*)'],
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if the path should be public
  const isPublicPath = [
    '/login', 
    '/api/auth/validate', 
    '/api/auth/csrf', 
    '/api/auth/logout'
  ].some(path => pathname === path || pathname.startsWith(path));
  
  const isStaticAsset = 
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/images/') || 
    pathname === '/favicon.ico';
  
  if (isPublicPath || isStaticAsset) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('airtrex-auth-token')?.value;
  if (!token) {
    // Construct absolute URL for redirection
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}