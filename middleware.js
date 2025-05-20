import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!api/auth|login|_next|favicon.ico|images).*)'
  ]
};

export async function middleware(request) {
  const token = request.cookies.get('airtrex-auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const res = await fetch(`${request.nextUrl.origin}/api/auth/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  });

  const data = await res.json();

  if (!res.ok || !data?.authenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}