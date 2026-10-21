import { getToken } from "next-auth/jwt";

// Plain JS (not TS) because server.js runs directly under Node.

// Auth.js uses the "__Secure-" cookie name over HTTPS and the plain one on
// http://localhost, so try both.
const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

/**
 * Works out which user a socket belongs to by verifying the Auth.js session
 * cookie that the browser sent with the connection. Returns the user id, or
 * null if there's no valid session. The client is never trusted to say who it
 * is.
 */
export const getSocketUserId = async (cookieHeader) => {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!cookieHeader || !secret) return null;

  for (const name of SESSION_COOKIE_NAMES) {
    try {
      const token = await getToken({
        req: { headers: { cookie: cookieHeader } },
        secret,
        cookieName: name,
        salt: name,
      });

      if (token && typeof token.userId === "string" && token.userId) {
        return token.userId;
      }
    } catch {
      // try the next cookie name
    }
  }

  return null;
};

/**
 * Browsers always send an Origin header on WebSocket handshakes. Only accept
 * connections from the site itself (Origin host === Host), which blocks other
 * websites from opening a socket with a visitor's cookies.
 */
export const isSameOrigin = (req) => {
  const origin = req.headers.origin;

  if (!origin) return true; // not a browser; it still needs a valid cookie

  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
};
