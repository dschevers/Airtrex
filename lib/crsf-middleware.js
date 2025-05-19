import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export function csrfProtection(handler) {
  return async (request) => {
    if (request.method === 'GET') return handler(request);
    
    const csrfToken = request.headers.get('X-CSRF-Token');
    const cookieStore = cookies();
    const storedToken = cookieStore.get('csrf-token')?.value;
    
    if (!csrfToken || !storedToken || csrfToken !== storedToken) {
      console.error('CSRF validation failed', { 
        providedToken: csrfToken, 
        storedToken: storedToken 
      });
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }
    
    return handler(request);
  };
}