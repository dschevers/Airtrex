// app/api/auth/csrf/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { devLog } from '../../../../lib/logger';

export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    let csrfToken = cookieStore.get('csrf-token')?.value;

    if (!csrfToken) {
      // Generate a new token and set it on the response
      csrfToken = crypto.randomBytes(32).toString('hex');
      const response = NextResponse.json({ csrfToken });
      response.cookies.set('csrf-token', csrfToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      devLog('🔒 [CSRF] Generated new token:', csrfToken);
      return response;
    }

    // Return the existing token if present
    devLog('🔒 [CSRF] Using existing token:', csrfToken);
    return NextResponse.json({ csrfToken });

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('CSRF generation error:', err.message);
    } else {
      console.error('CSRF generation error (non-Error):', err);
    }
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
