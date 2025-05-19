// middleware.js
import { NextResponse } from 'next/server'

/** Regex to catch any “.ext” file: .js .css .png .jpg .ico etc */
const PUBLIC_FILE = /\.(.*)$/

/** Only run this middleware on non‐public paths */
export const config = {
  matcher: [
    '/((?!api/auth/validate|api/auth/csrf|api/auth/logout|login|_next/static|_next/image|favicon.ico|images).*)'
  ]
}

export function middleware(request) {
  const { pathname } = request.nextUrl

  // ── 1) Let Next.js internals and static files through ───────────────
  if (
    // asset served from .next/
    pathname.startsWith('/_next/') ||
    // your image optimizer
    pathname.startsWith('/_next/image') ||
    // any “.xxx” file (css, js, png, svg…)
    PUBLIC_FILE.test(pathname) ||
    // favicon
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // ── 2) Let your public auth endpoints + login page through ───────────
  const PUBLIC_PATHS = [
    '/login',
    '/api/auth/validate',
    '/api/auth/csrf',
    '/api/auth/logout'
  ]
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── 3) Otherwise, enforce login by checking the cookie ────────────────
  const token = request.cookies.get('airtrex-auth-token')?.value
  if (!token) {
    // Not logged in → redirect to /login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in → allow
  return NextResponse.next()
}
