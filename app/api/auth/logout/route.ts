// app/api/auth/logout/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest): Promise<NextResponse> {
  // Clear the auth token cookie by setting it with maxAge=0
  const response = NextResponse.json({ success: true });
  response.cookies.set('airtrex-auth-token', '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    path:     '/',
    maxAge:   0,
  });
  return response;
}
