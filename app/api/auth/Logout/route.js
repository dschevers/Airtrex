import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery, sql } from '../../../../lib/db';
import { csrfProtection } from '../../../../lib/csrf-middleware';
import { devLog } from '../../../../lib/logger';

// app/api/auth/logout/route.js - Ensure proper cookie handling
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
      
      // Tell the browser to delete the cookie - be explicit with the settings
      cookieStore.delete('airtrex-auth-token', { 
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      devLog('🛑 [Logout] cookieStore.delete called for airtrex-auth-token');
    }
    
    // Return a successful response with explicit cookie deletion
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Set-Cookie': 'airtrex-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict; Secure=' + (process.env.NODE_ENV === 'production' ? 'true' : 'false')
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