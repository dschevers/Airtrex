import { NextResponse } from 'next/server';
import { validateAuthToken } from './lib/auth';

export const config = {
  matcher: [
    '/',                  // homepage
    '/parts-request',
    '/purchase-order',
    '/inventory',
    '/api/dropdowns',     // include only protected API routes
    '/api/something-else',
    '/((?!_next|favicon.ico|images|api/auth).*)',  // exclude static & auth via this pattern
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
