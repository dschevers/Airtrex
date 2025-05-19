// lib/auth.js
import { executeQuery, sql } from './db';
import { cookies } from 'next/headers';

export async function validateAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('airtrex-auth-token')?.value;
  
  if (!token) {
    return { valid: false, message: 'No authentication token found' };
  }
  
  try {
    const result = await executeQuery(
      `
      SELECT Token
      FROM Sessions
      WHERE Token = @token
        AND ExpiresAt > GETDATE()
        AND IsRevoked = 0
      `,
      [{ name: 'token', type: sql.NVarChar, value: token }]
    );

    if (result.recordset.length === 0) {
      return { valid: false, message: 'Invalid or expired session' };
    }
    
    return { valid: true, token };
  } catch (err) {
    console.error('Auth validation error:', err.message);
    return { valid: false, message: 'Error validating session' };
  }
}

// Higher-order function for protecting API routes
export function withAuth(handler) {
  return async (request, ...args) => {
    const { valid, message } = await validateAuthToken();
    
    if (!valid) {
      return new Response(
        JSON.stringify({ error: message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return handler(request, ...args);
  };
}