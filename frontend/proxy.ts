import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  isExpiring,
} from "@/lib/auth/tokens";

/**
 * Keeps dashboard sessions alive and turns away requests with no session at all.
 * This is an optimistic check on cookies only. Real authentication happens in
 * lib/auth/session.ts, which asks Saleor on every render that shows store data.
 */

const TOKEN_REFRESH = /* GraphQL */ `
  mutation Refresh($refreshToken: String!) {
    tokenRefresh(refreshToken: $refreshToken) {
      token
    }
  }
`;

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(process.env.SALEOR_API_URL ?? "http://localhost:8000/graphql/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: TOKEN_REFRESH, variables: { refreshToken } }),
      signal: AbortSignal.timeout(5000),
    });
    const body = (await response.json()) as {
      data?: { tokenRefresh?: { token?: string | null } | null };
    };
    return body.data?.tokenRefresh?.token ?? null;
  } catch {
    return null;
  }
}

function toSignIn(request: NextRequest, reason?: string) {
  const url = new URL("/login", request.url);
  if (reason) url.searchParams.set("reason", reason);
  if (request.nextUrl.pathname !== "/dashboard") {
    url.searchParams.set("next", request.nextUrl.pathname);
  }
  const response = NextResponse.redirect(url);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access && !isExpiring(access)) return NextResponse.next();

  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) return toSignIn(request);

  const renewed = await refreshAccessToken(refresh);
  if (!renewed) return toSignIn(request, "expired");

  // Forward the new token to this render, and store it in the browser for the next one.
  request.cookies.set(ACCESS_COOKIE, renewed);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(ACCESS_COOKIE, renewed, accessCookieOptions(renewed));
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
