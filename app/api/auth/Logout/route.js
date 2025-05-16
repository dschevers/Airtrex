import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery, sql } from '../../../../lib/db';

export async function POST(request) {
  try {
    // Get auth token
    const cookieStore = cookies();
    const token = cookieStore.get('airtrex-auth-token')?.value;
    
    if (token) {
      // Mark session as revoked in database
      await executeQuery(`
        UPDATE Sessions SET IsRevoked = 1 WHERE Token = @token
      `, [
        { name: 'token', type: sql.NVarChar, value: token }
      ]);
      
      // Delete cookie
      cookieStore.delete('airtrex-auth-token');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true }); // Return success anyway
  }
}