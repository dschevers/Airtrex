import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery, sql } from '../../../../lib/db';
import { devLog } from '../../../../lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { csrfProtection } from '../../../../lib/csrf-middleware';
import bcrypt from 'bcryptjs';

export const POST = csrfProtection(async (request) => {
  try {
    // Get request body
    const { password } = await request.json();
    
    // Log environment variables for debugging (remove in production)
    console.log('Environment variables:', { 
      NODE_ENV: process.env.NODE_ENV,
      HASHED_PASSWORD_EXISTS: !!process.env.HASHED_PASSWORD,
      // Don't log the actual password
    });
    
    const cookieStore = await cookies();
    
    // Check if we already have an auth token
    const existingToken = cookieStore.get('airtrex-auth-token')?.value;
    
    if (existingToken) {
      // Verify existing token in database
      const sessionResult = await executeQuery(
        `
        SELECT Token, ExpiresAt, IsRevoked
        FROM Sessions
        WHERE Token = @token
          AND ExpiresAt > GETDATE()
          AND IsRevoked = 0
        `,
        [{ name: 'token', type: sql.NVarChar, value: existingToken }]
      );
      
      if (sessionResult.recordset.length > 0) {
        // Valid session exists
        return NextResponse.json({
          authenticated: true,
          user: {
            role: 'user' // Default role
          }
        });
      }
      
      // Token exists but is invalid - remove it
      cookieStore.delete('airtrex-auth-token', { path: '/' });
    }
    
    // No valid session, check password
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    // Get hashed password from environment variable
    const hashedPassword = process.env.HASHED_PASSWORD;
    
    if (!hashedPassword) {
      console.error('HASHED_PASSWORD environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Verify password using bcrypt to compare with stored hash
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    // For debugging only (remove in production)
    console.log('Password check:', { 
      passwordProvided: !!password,
      hashedPasswordExists: !!hashedPassword,
      passwordLength: password.length,
      isValid
    });
    
    if (!isValid) {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      
      try {
        // Check if we have a record for this IP
        const result = await executeQuery(
          `
          SELECT ID, AttemptCount
          FROM LoginAttempts
          WHERE IPAddress = @ipAddress
          `,
          [{ name: 'ipAddress', type: sql.NVarChar, value: ipAddress }]
        );
        
        const now = new Date();
        
        if (result.recordset.length > 0) {
          // Update existing record
          const { ID, AttemptCount } = result.recordset[0];
          const newCount = AttemptCount + 1;
          
          // Calculate lock time if needed (5 attempts = 15 min lockout)
          let lockUntil = null;
          if (newCount >= 5) {
            lockUntil = new Date(now);
            lockUntil.setMinutes(lockUntil.getMinutes() + 15);
          }
          
          await executeQuery(
            `
            UPDATE LoginAttempts
            SET AttemptCount = @attemptCount,
                LastAttempt = @lastAttempt,
                LockUntil = @lockUntil
            WHERE ID = @id
            `,
            [
              { name: 'id', type: sql.Int, value: ID },
              { name: 'attemptCount', type: sql.Int, value: newCount },
              { name: 'lastAttempt', type: sql.DateTime, value: now },
              { name: 'lockUntil', type: sql.DateTime, value: lockUntil }
            ]
          );
        } else {
          // Insert new record
          await executeQuery(
            `
            INSERT INTO LoginAttempts (IPAddress, AttemptCount, LastAttempt, LockUntil)
            VALUES (@ipAddress, 1, @lastAttempt, NULL)
            `,
            [
              { name: 'ipAddress', type: sql.NVarChar, value: ipAddress },
              { name: 'lastAttempt', type: sql.DateTime, value: now }
            ]
          );
        }
      } catch (error) {
        // Just log error but continue
        console.error('Error recording login attempt:', error.message);
      }
      
      devLog('🔒 [Auth] Invalid password attempt');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Password is valid, create a new session
    const token = uuidv4();
    const createdAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Store session in database - each device gets its own session
    await executeQuery(
      `
      INSERT INTO Sessions (Token, IPAddress, UserAgent, CreatedAt, ExpiresAt, IsRevoked)
      VALUES (@token, @ipAddress, @userAgent, @createdAt, @expiresAt, 0)
      `,
      [
        { name: 'token', type: sql.NVarChar, value: token },
        { name: 'ipAddress', type: sql.NVarChar, value: ipAddress },
        { name: 'userAgent', type: sql.NVarChar, value: userAgent },
        { name: 'createdAt', type: sql.DateTime, value: createdAt },
        { name: 'expiresAt', type: sql.DateTime, value: expiresAt }
      ]
    );
    
    // Set the session cookie
    cookieStore.set('airtrex-auth-token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt
    });
    
    // Reset login attempts for this IP on successful login
    try {
      await executeQuery(
        `
        DELETE FROM LoginAttempts
        WHERE IPAddress = @ipAddress
        `,
        [{ name: 'ipAddress', type: sql.NVarChar, value: ipAddress }]
      );
    } catch (error) {
      // Just log error but continue
      console.error('Error resetting login attempts:', error.message);
    }
    
    devLog(`🔐 [Auth] Successful login from IP: ${ipAddress}`);
    
    return NextResponse.json({
      authenticated: true,
      user: {
        role: 'user' // Default role
      }
    });
    
  } catch (error) {
    console.error('Authentication error:', error.message);
    return NextResponse.json(
      { error: 'Authentication failed: ' + error.message },
      { status: 500 }
    );
  }
});