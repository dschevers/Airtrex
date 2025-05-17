import { NextResponse } from 'next/server';
import { csrfProtection } from '../../../../lib/crsf-middleware';
import { cookies } from 'next/headers';
import { executeQuery, sql } from '../../../../lib/db';
import { devLog } from '../../../../lib/logger';

export const POST = csrfProtection(async () => {
  const cookieStore = cookies();
  
  // Debug: list all cookies that arrived
  devLog('🛑 [Logout] incoming cookies:', cookieStore.getAll().map(c => `${c.name}=${c.value}`));

  const token = cookieStore.get('airtrex-auth-token')?.value;
  devLog('🛑 [Logout] session token to revoke:', token);

  if (token) {
    await executeQuery(
      `UPDATE Sessions SET IsRevoked = 1 WHERE Token = @token`,
      [{ name: 'token', type: sql.NVarChar, value: token }]
    );

    // Tell the browser to delete the cookie
    cookieStore.delete('airtrex-auth-token', { path: '/' });
    devLog('🛑 [Logout] cookieStore.delete called for airtrex-auth-token');
  }

  const res = NextResponse.json({ success: true });
  devLog('🛑 [Logout] Response headers being sent:', res.headers.get('set-cookie'));
  return res;
});