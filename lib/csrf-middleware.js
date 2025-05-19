import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { devLog } from './logger';

export function csrfProtection(handler) {
  return async (request) => {
    if (request.method === 'GET') return handler(request);
    
    try {
      // Get token from header
      const csrfToken = request.headers.get('X-CSRF-Token');
      
      // Get token from body as fallback
      let bodyToken;
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        bodyToken = body.csrfToken;
      } catch {
        // Ignore JSON parsing errors - empty catch block with no variable
      }
      
      const providedToken = csrfToken || bodyToken;
      
      const cookieStore = await cookies();
      const storedToken = cookieStore.get('csrf-token')?.value;
      
      devLog('CSRF Check:', {
        providedToken,
        storedToken,
        headerToken: csrfToken,
        bodyToken
      });
      
      if (!providedToken || !storedToken || providedToken !== storedToken) {
        console.error('CSRF validation failed', { 
          providedToken, 
          storedToken,
          headerToken: csrfToken,
          bodyToken
        });
        return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
      }
      
      return handler(request);
    } catch (error) {
      console.error('CSRF middleware error:', error);
      return NextResponse.json({ error: 'CSRF validation error' }, { status: 403 });
    }
  };
}