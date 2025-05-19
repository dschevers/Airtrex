import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery, sql } from '../../../../lib/db';
import { csrfProtection } from '../../../../lib/csrf-middleware';
import { devLog } from '../../../../lib/logger';

export const POST = csrfProtection(async () => {
  try {
    const cookieStore = await cookies();
    
    devLog('🛑 [Logout] incoming cookies:', cookieStore.getAll().map(c => `${c.name}=${c.value}`));
    
    const token = cookieStore.get('airtrex-auth-token')?.value;
    devLog('🛑 [Logout] session token to revoke:', token);
    
    if (token) {
      // Mark the token as revoked in the database
      await executeQuery(
        `UPDATE Sessions SET IsRevoked = 1 WHERE Token = @token`,
        [{ name: 'token', type: sql.NVarChar, value: token }]
      );
      
      // Tell the browser to delete the cookie
      cookieStore.delete('airtrex-auth-token', { path: '/' });
      devLog('🛑 [Logout] cookieStore.delete called for airtrex-auth-token');
    }
    
    devLog('🛑 [Logout] Response headers being sent:', null);
    
    // Return a successful response with session cookie deleted
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Set-Cookie': 'airtrex-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict'
        }
      }
    );
  } catch (error) {
    console.error('Logout error:', error.message);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
});