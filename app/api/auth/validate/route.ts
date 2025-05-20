import { validateAuthToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  const { valid } = await validateAuthToken();
  return NextResponse.json({ authenticated: valid });
}
