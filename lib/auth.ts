import { NextRequest, NextResponse } from 'next/server';
import { isValidSessionToken } from './session';
/**
 * Result of authentication token validation.
 */
export interface AuthResult {
  valid: boolean;
  token?: string;
  message?: string;
}

/**
 * Validates a session token by checking if it's present and not expired.
 * @param token - Session token string
 * @returns AuthResult indicating validity and optional message
 */
export async function validateAuthToken(token?: string): Promise<AuthResult> {
  if (!token) {
    return { valid: false, message: 'No authentication token found' };
  }

  const valid = await isValidSessionToken(token);
  if (valid) {
    return { valid: true, token };
  }
  return { valid: false, message: 'Invalid or expired session' };
}

/**
 * Type for protected API route handlers.
 */
export type ApiHandler = (
  _request: NextRequest,
  ...args: unknown[]
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function to protect API routes.
 * Wrap your handler: export const GET = withAuth(async (req) => { ... });
 */
export function withAuth(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    // Extract token from cookies (ensure client sets it)
    const token = request.cookies.get('airtrex-auth-token')?.value;
    const { valid, message } = await validateAuthToken(token);

    if (!valid) {
      return NextResponse.json(
        { error: message },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delegate to the original handler
    return handler(request, ...args);
  };
}