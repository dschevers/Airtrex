// app/api/auth/login/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { cookies }                  from 'next/headers';
import { executeQuery, sql }        from '../../../../lib/db';
import { csrfProtection }           from '../../../../lib/csrf-middleware';
import { v4 as uuidv4 }             from 'uuid';
import bcrypt                        from 'bcryptjs';

interface LoginBody {
  password?: string;
}

export const POST = csrfProtection(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1️⃣ Parse and type the incoming JSON
      const { password } = (await request.json()) as LoginBody;

      // 2️⃣ Grab the cookie store
      const cookieStore = await cookies();

      // 3️⃣ Check for an existing valid session
      const existingToken = cookieStore.get('airtrex-auth-token')?.value;
      if (existingToken) {
        const sessionResult = await executeQuery<{ Token: string }>(
          `SELECT Token
             FROM Sessions
            WHERE Token = @token
              AND ExpiresAt > GETDATE()
              AND IsRevoked = 0`,
          [{ name: 'token', type: sql.NVarChar, value: existingToken }]
        );

        if (sessionResult.recordset.length > 0) {
          return NextResponse.json({ authenticated: true });
        }

        // Invalidate the old cookie
        cookieStore.delete('airtrex-auth-token');
      }

      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }

      // 4️⃣ Verify against server-side hash
      const hashedPassword = process.env.HASHED_PASSWORD;
      if (!hashedPassword) {
        return NextResponse.json(
          { error: 'Server config error' },
          { status: 500 }
        );
      }
      const isValid = await bcrypt.compare(password, hashedPassword);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // 5️⃣ Create a new session
      const token     = uuidv4();
      const createdAt = new Date();
      const expiresAt = new Date(createdAt);
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Capture client info
      const ipAddress = request.headers.get('x-forwarded-for')
                      || request.headers.get('x-real-ip')
                      || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await executeQuery(
        `INSERT INTO Sessions
           (Token, IPAddress, UserAgent, CreatedAt, ExpiresAt, IsRevoked)
         VALUES
           (@token, @ipAddress, @userAgent, @createdAt, @expiresAt, 0)`,
        [
          { name: 'token',      type: sql.NVarChar, value: token },
          { name: 'ipAddress',  type: sql.NVarChar, value: ipAddress },
          { name: 'userAgent',  type: sql.NVarChar, value: userAgent },
          { name: 'createdAt',  type: sql.DateTime,  value: createdAt },
          { name: 'expiresAt',  type: sql.DateTime,  value: expiresAt },
        ]
      );

      // 6️⃣ Set the cookie on the response
      const response = NextResponse.json({ authenticated: true });
      response.cookies.set('airtrex-auth-token', token, {
        path:     '/',
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires:  expiresAt,
      });

      return response;

    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Login error:', err.message);
      } else {
        console.error('Login error (non-Error):', err);
      }
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  }
);
