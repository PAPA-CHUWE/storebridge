/**
 * Cookie names and token helpers shared by the proxy and server code.
 * No "server-only" import: the proxy bundles this file too.
 */
export const ACCESS_COOKIE = "sb_access";
export const REFRESH_COOKIE = "sb_refresh";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Reads the expiry from a JWT without verifying it. This only decides when to refresh;
 * Saleor and the StoreBridge API verify the signature on every real request.
 */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

export function isExpiring(token: string, withinSeconds = 30): boolean {
  const exp = tokenExpiry(token);
  return exp === null || exp - withinSeconds <= Date.now() / 1000;
}

function baseCookie() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function accessCookieOptions(token: string) {
  const exp = tokenExpiry(token);
  const maxAge = exp ? Math.max(0, Math.floor(exp - Date.now() / 1000)) : 300;
  return { ...baseCookie(), maxAge };
}

export function refreshCookieOptions() {
  return { ...baseCookie(), maxAge: THIRTY_DAYS };
}
