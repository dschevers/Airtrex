import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST() {
  const cookieStore = cookies(); // TypeScript sometimes assumes this is async incorrectly

  // Force it to behave correctly
  const token = (cookieStore as any).get('airtrex-auth-token')?.value;

  if (token) {
    await executeQuery(
      `UPDATE Sessions SET IsRevoked = 1 WHERE Token = @token`,
      [{ name: 'token', type: sql.NVarChar, value: token }]
    );

    (cookieStore as any).delete('airtrex-auth-token');
  }

  return NextResponse.json({ success: true }, {
    headers: {
      'Set-Cookie': 'airtrex-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict; Secure'
    }
  });
}
