import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!_next|favicon.ico|images|api/auth).*)'],
};

export async function middleware(request) {
  const res = await fetch(`${request.nextUrl.origin}/api/auth/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  const { authenticated } = await res.json();

  if (!authenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}