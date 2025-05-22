// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Pull pathname from request.nextUrl, method from request
  const pathname = request.nextUrl.pathname;
  const method   = request.method;

  // Only on first GET to /login
  if (pathname === '/login' && method === 'GET') {
    const response = NextResponse.next();

    if (!request.cookies.get('csrf-token')) {
      // Generate a 32-byte random hex string via Web Crypto API
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const token = Array.from(array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      response.cookies.set('csrf-token', token, {
        path:     '/',
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/login',
};
