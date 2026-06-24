import jwt from 'jsonwebtoken';

const cookieName =
  process.env.COOKIE_NAME || 'aegis_token';

const sevenDaysInMilliseconds =
  7 * 24 * 60 * 60 * 1000;

export function createAuthToken(userId) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not configured.'
    );
  }

  return jwt.sign(
    {
      userId
    },
    secret,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || '7d'
    }
  );
}

export function getCookieOptions() {
  const isProduction =
    process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: sevenDaysInMilliseconds,
    path: '/'
  };
}

export function setAuthCookie(
  response,
  token
) {
  response.cookie(
    cookieName,
    token,
    getCookieOptions()
  );
}

export function clearAuthCookie(response) {
  const options = getCookieOptions();

  response.clearCookie(cookieName, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path
  });
}

export function getAuthCookieName() {
  return cookieName;
}