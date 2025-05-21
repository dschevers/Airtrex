// app/api/auth/csrf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies }                  from 'next/headers';
import crypto                        from 'crypto';
import { devLog }                    from '../../../../lib/logger';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Read cookies
    const cookieStore = await cookies();
    let csrfToken = cookieStore.get('csrf-token')?.value;

    // If token missing, generate and set it
    if (!csrfToken) {
      csrfToken = crypto.randomBytes(32).toString('hex');
      const response = NextResponse.json({ csrfToken });
      response.cookies.set('csrf-token', csrfToken, {
        path:     '/',
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      devLog('🔒 [CSRF] Generated new token:', csrfToken);
      return response;
    }

    // Return the existing token
    devLog('🔒 [CSRF] Using existing token:', csrfToken);
    return NextResponse.json({ csrfToken });

  } catch (err: unknown) {
    // Safely handle unknown error
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
