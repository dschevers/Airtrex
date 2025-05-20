import { isValidSessionToken } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const token = request.headers.get('cookie')?.match(/airtrex-auth-token=([^;]+)/)?.[1];
  const valid = await isValidSessionToken(token); // your own function

  return NextResponse.json({ authenticated: valid });
}