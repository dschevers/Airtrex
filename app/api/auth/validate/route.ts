// app/api/auth/validate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies }                from 'next/headers';
import { validateAuthToken }      from '../../../../lib/auth';

export async function POST(_request: NextRequest) {
  // 1️⃣ Grab the cookie jar (must await if your version returns a Promise)
  const cookieStore = await cookies();
  const token       = cookieStore.get('airtrex-auth-token')?.value ?? '';

  // 2️⃣ Validate
  const { valid } = await validateAuthToken(token);

  // 3️⃣ Return JSON
  return NextResponse.json({ authenticated: valid });
}
