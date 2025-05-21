import { executeQuery, sql } from './db';

/**
 * Checks whether a session token exists in the database, is not expired, and is not revoked.
 * @param token - Session token string
 * @returns True if the token is valid, false otherwise
 */
export async function isValidSessionToken(token?: string): Promise<boolean> {
  if (!token) return false;

  try {
    const result = await executeQuery<{ Token: string }>(
      `SELECT Token FROM Sessions
       WHERE Token = @token
         AND ExpiresAt > GETDATE()
         AND IsRevoked = 0`,
      [{ name: 'token', type: sql.NVarChar, value: token }]
    );

    return result.recordset.length > 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Token validation error:', msg);
    return false;
  }
}