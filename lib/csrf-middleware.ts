import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { devLog } from './logger';

export type Handler = (_request: NextRequest) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an API route handler to enforce CSRF protection.
 * The token must be provided in the X-CSRF-Token header or in the JSON body under csrfToken,
 * and must match the csrf-token cookie.
 */
export function csrfProtection(handler: Handler): Handler {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Allow GET requests through without CSRF check
    if (request.method === 'GET') {
      return handler(request);
    }

    try {
      // Pull token from header
      const headerToken = request.headers.get('X-CSRF-Token') ?? undefined;

      // Pull token from JSON body as fallback
      let bodyToken: string | undefined;
      try {
        const cloned = request.clone();
        const jsonBody = await cloned.json();
        if (typeof jsonBody.csrfToken === 'string') {
          bodyToken = jsonBody.csrfToken;
        }
      } catch {
        // ignore parsing errors
      }

      const providedToken = headerToken || bodyToken;

      // Read the stored CSRF token cookie
      const cookieStore = await cookies();
      const storedToken = cookieStore.get('csrf-token')?.value;

      devLog('CSRF Check:', { providedToken, storedToken, headerToken, bodyToken });

      // Validate tokens
      if (!providedToken || !storedToken || providedToken !== storedToken) {
        console.error('CSRF validation failed', { providedToken, storedToken, headerToken, bodyToken });
        return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
      }

      // All good
      return handler(request);
    } catch (error) {
      console.error('CSRF middleware error:', error);
      return NextResponse.json({ error: 'CSRF validation error' }, { status: 403 });
    }
  };
}
