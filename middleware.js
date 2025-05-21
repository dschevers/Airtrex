// middleware.js
import { NextResponse } from 'next/server'
import { cookies }     from 'next/headers'
import { validateAuthToken } from './lib/auth'   // your server‐side helper

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|images|api/auth|login).*)'
  ]
}

export async function middleware(request) {
  // Grab the session token from the cookie store
  const token = cookies().get('airtrex-auth-token')?.value

  // Call your existing validation function directly
  const { valid } = await validateAuthToken(token)

  if (!valid) {
    // Not logged in → send to /login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // All good → continue
  return NextResponse.next()
}