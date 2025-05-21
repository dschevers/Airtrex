import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { validateAuthToken } from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies(); // ✅ Await this
  const token = cookieStore.get('airtrex-auth-token')?.value;

  const { valid } = await validateAuthToken(token);
  return NextResponse.json({ authenticated: valid });
}