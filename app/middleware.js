import { NextResponse } from 'next/server';
import { executeQuery, sql } from '../lib/db';  // <-- use your mssql pool
import { devLog } from './lib/logger';

export const config = {
  matcher: ['/((?!api/auth/validate|login|_next/static|_next/image|favicon.ico|images).*)'],
};

export async function middleware(request) {
  // Skip auth check for public routes
  const publicPaths = ['/login', '/api/auth/validate'];
  const path = request.nextUrl.pathname;
  if (
    publicPaths.includes(path) ||
    path.startsWith('/_next/') ||
    path.startsWith('/images/') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('airtrex-auth-token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify session in Azure SQL
    const result = await executeQuery(
      `
        SELECT Token
        FROM Sessions
        WHERE Token = @token
          AND ExpiresAt   > GETDATE()
          AND IsRevoked   = 0
      `,
      [{ name: 'token', type: sql.NVarChar, value: token }]
    );

    if (result.recordset.length === 0) {
      // no matching valid session
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}