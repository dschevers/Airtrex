import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST() {
  const cookieStore = await cookies(); // ✅ fix the TS error
  const token = cookieStore.get('airtrex-auth-token')?.value;

  if (token) {
    await executeQuery(
      `UPDATE Sessions SET IsRevoked = 1 WHERE Token = @token`,
      [{ name: 'token', type: sql.NVarChar, value: token }]
    );
  }

  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Set-Cookie':
          'airtrex-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict; Secure',
      },
    }
  );
}
