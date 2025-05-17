import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function GET() {
  // Generate CSRF token
  const csrfToken = crypto.randomBytes(32).toString('hex');
  
  // Set in cookie for validation
  const cookieStore = await cookies();
  // Remove the incorrect await directly on cookies().set
  cookieStore.set('csrf-token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  // Return to client
  return NextResponse.json({ csrfToken });
}