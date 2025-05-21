export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server';
import { cookies }                  from 'next/headers';
import { validateAuthToken }        from './lib/auth';

export const config = {
  matcher: ['/((?!_next|favicon.ico|images|api\\/auth|login).*)'],
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Await the cookie store
  const cookieStore = await cookies();
  const token       = cookieStore.get('airtrex-auth-token')?.value ?? '';

  const { valid } = await validateAuthToken(token);
  if (!valid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
