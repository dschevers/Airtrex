import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery, sql } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { csrfProtection } from '@/lib/csrf-middleware';
import bcrypt from 'bcryptjs';

export const POST = csrfProtection(async (request) => {
  try {
    const { password } = await request.json();

    const cookieStore = await cookies();

    // Check if user already has a valid session
    const existingToken = cookieStore.get('airtrex-auth-token')?.value;

    if (existingToken) {
      const sessionResult = await executeQuery(
        `SELECT Token FROM Sessions WHERE Token = @token AND ExpiresAt > GETDATE() AND IsRevoked = 0`,
        [{ name: 'token', type: sql.NVarChar, value: existingToken }]
      );

      if (sessionResult.recordset.length > 0) {
        return NextResponse.json({ authenticated: true });
      }

      cookieStore.delete('airtrex-auth-token', { path: '/' });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const hashedPassword = process.env.HASHED_PASSWORD;

    if (!hashedPassword) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const isValid = await bcrypt.compare(password, hashedPassword);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = uuidv4();
    const createdAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await executeQuery(
      `INSERT INTO Sessions (Token, IPAddress, UserAgent, CreatedAt, ExpiresAt, IsRevoked)
       VALUES (@token, @ipAddress, @userAgent, @createdAt, @expiresAt, 0)`,
      [
        { name: 'token', type: sql.NVarChar, value: token },
        { name: 'ipAddress', type: sql.NVarChar, value: ipAddress },
        { name: 'userAgent', type: sql.NVarChar, value: userAgent },
        { name: 'createdAt', type: sql.DateTime, value: createdAt },
        { name: 'expiresAt', type: sql.DateTime, value: expiresAt },
      ]
    );

    cookieStore.set('airtrex-auth-token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt
    });

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Login error:', error.message);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
});
