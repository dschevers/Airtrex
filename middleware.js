import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/',
    '/((?!_next|favicon.ico|images|api/auth|login).*)'
  ]
};

export async function middleware(request) {
  const cookieHeader = request.headers.get('cookie') || '';

  const res = await fetch(`${request.nextUrl.origin}/api/auth/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader // ✅ pass user's cookies to validate route
    },
    body: '{}',
  });

  const data = await res.json();

  if (!res.ok || !data?.authenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}