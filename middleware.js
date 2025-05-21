import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|images|api/auth|login).*)'
  ]
};

export async function middleware(request) {
  try {
    const res = await fetch(`${request.nextUrl.origin}/api/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok || !data?.authenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error('Middleware error:', err);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
