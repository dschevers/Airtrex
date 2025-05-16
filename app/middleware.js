// middleware.js
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function middleware(request) {
  // Skip auth check for public routes
  const publicPaths = ['/login', '/api/auth/validate'];
  const path = request.nextUrl.pathname;
  
  if (publicPaths.some(publicPath => path === publicPath) || 
      path.startsWith('/_next/') || 
      path.startsWith('/images/') ||
      path === '/favicon.ico') {
    return NextResponse.next();
  }
  
  // Check for auth token
  const token = request.cookies.get('airtrex-auth-token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // Check if token is valid in database
    const { rows } = await sql`
      SELECT * FROM Sessions 
      WHERE Token = ${token} 
      AND ExpiresAt > NOW() 
      AND IsRevoked = FALSE
    `;
    
    if (rows.length === 0) {
      // Invalid or expired token
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Log the request for security monitoring
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    console.log(`[${new Date().toISOString()}] Authorized request: ${request.method} ${path} - IP: ${ip}`);
    console.log(`Request from user agent: ${request.headers.get('user-agent') || 'unknown'}`);
    
    // Valid token, continue
    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // On error, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api/auth/validate|login|_next/static|_next/image|favicon.ico|images).*)'],
};