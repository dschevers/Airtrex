// app/api/auth/validate/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, sql } from '../../../../lib/db';

// Rate limiting setup (using database for persistence)
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

export async function POST(request) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check if IP is locked out (using database check)
    const lockoutCheck = await executeQuery(`
      SELECT LockUntil, AttemptCount 
      FROM LoginAttempts 
      WHERE IPAddress = @ip
    `, [
      { name: 'ip', type: sql.NVarChar, value: ip }
    ]);
    
    const currentTime = new Date().getTime();
    let attemptCount = 0;
    //let isLocked = false;//
    
    if (lockoutCheck.recordset.length > 0) {
      const record = lockoutCheck.recordset[0];
      attemptCount = record.AttemptCount;
      
      if (record.LockUntil && new Date(record.LockUntil).getTime() > currentTime) {
        const remainingTime = Math.ceil((new Date(record.LockUntil).getTime() - currentTime) / 1000 / 60);
        
        return NextResponse.json(
          { error: `Too many failed attempts. Try again in ${remainingTime} minutes.` },
          { status: 429 }
        );
      }
    }
    
    // Get password from request
    const { password } = await request.json();
    
    // Get hashed password from environment variable
    const hashedPassword = process.env.HASHED_PASSWORD;
    
    if (!hashedPassword) {
      console.error('Hashed password environment variable not set!');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Compare with stored hash
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    if (isValid) {
      // Reset login attempts on success
      await executeQuery(`
        DELETE FROM LoginAttempts WHERE IPAddress = @ip
      `, [
        { name: 'ip', type: sql.NVarChar, value: ip }
      ]);
      
      // Generate session token
      const sessionToken = uuidv4();
      const expiryTime = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
      
      // Store session in database
      await executeQuery(`
        INSERT INTO Sessions (Token, IPAddress, UserAgent, ExpiresAt)
        VALUES (@token, @ip, @userAgent, @expiresAt)
      `, [
        { name: 'token', type: sql.NVarChar, value: sessionToken },
        { name: 'ip', type: sql.NVarChar, value: ip },
        { name: 'userAgent', type: sql.NVarChar, value: request.headers.get('user-agent') || 'unknown' },
        { name: 'expiresAt', type: sql.DateTime, value: expiryTime }
      ]);
      
      // Set cookie with session token
      const cookieStore = cookies();
      cookieStore.set('airtrex-auth-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: expiryTime,
        path: '/'
      });
      
      // Log successful login
      console.log(`[${new Date().toISOString()}] Successful login from IP: ${ip}`);
      
      return NextResponse.json({ 
        success: true,
        message: 'Authentication successful' 
      });
    } else {
      // Increment failed attempts
      attemptCount += 1;
      let lockUntil = null;
      
      if (attemptCount >= MAX_ATTEMPTS) {
        lockUntil = new Date(Date.now() + LOCK_TIME);
      }
      
      // Update or insert login attempts record
      await executeQuery(`
        MERGE INTO LoginAttempts AS target
        USING (SELECT @ip AS IPAddress) AS source
        ON target.IPAddress = source.IPAddress
        WHEN MATCHED THEN
          UPDATE SET AttemptCount = @attemptCount, LockUntil = @lockUntil, LastAttempt = @lastAttempt
        WHEN NOT MATCHED THEN
          INSERT (IPAddress, AttemptCount, LockUntil, LastAttempt)
          VALUES (@ip, @attemptCount, @lockUntil, @lastAttempt);
      `, [
        { name: 'ip', type: sql.NVarChar, value: ip },
        { name: 'attemptCount', type: sql.Int, value: attemptCount },
        { name: 'lockUntil', type: sql.DateTime, value: lockUntil },
        { name: 'lastAttempt', type: sql.DateTime, value: new Date() }
      ]);
      
      // Log failed login attempt
      console.log(`[${new Date().toISOString()}] Failed login attempt from IP: ${ip}, Attempt #${attemptCount}`);
      
      // Add delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return appropriate error message
      if (attemptCount >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: 'Too many failed attempts. Try again in 15 minutes.' },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { error: `Authentication failed. ${MAX_ATTEMPTS - attemptCount} attempts remaining.` },
          { status: 401 }
        );
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}