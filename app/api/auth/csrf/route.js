import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { devLog } from '../../../../lib/logger';

export async function GET() {
  try {
    const cookieStore = await cookies();
    let csrfToken = cookieStore.get('csrf-token')?.value;
    
    // Only generate a new token if one doesn't already exist
    if (!csrfToken) {
      csrfToken = crypto.randomBytes(32).toString('hex');
      
      // Store the token in a cookie
      cookieStore.set('csrf-token', csrfToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        // Don't set an expiration to make it a session cookie
      });
      
      devLog('🔒 [CSRF] Generated new token:', csrfToken);
    } else {
      devLog('🔒 [CSRF] Using existing token:', csrfToken);
    }
    
    // Return the token to the client
    return NextResponse.json({ csrfToken });
  } catch (error) {
    console.error('CSRF generation error:', error.message);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}