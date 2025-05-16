import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export function csrfProtection(handler) {
  return async (request) => {
    // Skip for GET requests
    if (request.method === 'GET') {
      return handler(request);
    }
    
    // Get CSRF token from request header
    const csrfToken = request.headers.get('X-CSRF-Token');
    
    // Get token from cookie
    const cookieStore = cookies();
    const storedToken = cookieStore.get('csrf-token')?.value;
    
    // Validate tokens match
    if (!csrfToken || !storedToken || csrfToken !== storedToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
    
    // Token is valid, proceed to handler
    return handler(request);
  };
}