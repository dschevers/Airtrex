import { NextResponse } from 'next/server';
import { validateAuthToken } from './lib/auth';

export const config = {
  matcher: [
    '/',                 // root
    '/parts-request',    // page
    '/purchase-order',
    '/inventory',
    '/((?!_next|favicon.ico|images|api/auth).*)',  // excludes static and auth routes
    '/api/(?!auth/).*',  // all other API routes
  ]
};

export async function middleware(request) {
  // ✅ Token-based validation using your shared function
  const { valid } = await validateAuthToken();

  if (!valid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
