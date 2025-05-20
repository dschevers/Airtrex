// lib/auth.js
import { cookies } from 'next/headers';
import { isValidSessionToken } from './session';

export async function validateAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('airtrex-auth-token')?.value;

  if (!token) {
    return { valid: false, message: 'No authentication token found' };
  }

  const valid = await isValidSessionToken(token);

  return valid
    ? { valid: true, token }
    : { valid: false, message: 'Invalid or expired session' };
}

// Higher-order function for protecting API routes
export function withAuth(handler) {
  return async (request, ...args) => {
    const { valid, message } = await validateAuthToken();

    if (!valid) {
      return new Response(
        JSON.stringify({ error: message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, ...args);
  };
}
