import { executeQuery, sql } from './db';

export async function isValidSessionToken(token) {
  if (!token) return false;

  try {
    const result = await executeQuery(
      `SELECT Token FROM Sessions WHERE Token = @token AND ExpiresAt > GETDATE() AND IsRevoked = 0`,
      [{ name: 'token', type: sql.NVarChar, value: token }]
    );

    return result.recordset.length > 0;
  } catch (err) {
    console.error('Token validation error:', err.message);
    return false;
  }
}
