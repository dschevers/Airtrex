import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  // 1) Generate a new token
  const csrfToken = crypto.randomBytes(32).toString('hex');

  // 2) Build a response and attach Set-Cookie
  const res = NextResponse.json({ csrfToken });
  res.cookies.set('csrf-token', csrfToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path:     '/'
  });

  return res;
}