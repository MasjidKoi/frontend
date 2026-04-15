import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "mkoi_token";

type UserRole = "platform_admin" | "masjid_admin" | "madrasha_admin";
type Aal = "aal1" | "aal2";

interface ParsedToken {
  sub: string;
  email: string;
  app_metadata?: { role?: UserRole; masjid_id?: string | null };
  aal?: Aal;
  exp?: number;
}

/** Decode a JWT payload without verification — Edge runtime safe (no npm packages). */
function parseToken(token: string): ParsedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // atob is available in Edge runtime
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload) as ParsedToken;
  } catch {
    return null;
  }
}

function isExpired(payload: ParsedToken): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

const ADMIN_ROUTES = ["/admin"];
const MASJID_ROUTES = ["/masjid"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const tokenValue = request.cookies.get(TOKEN_COOKIE)?.value;
  const decoded = tokenValue ? parseToken(tokenValue) : null;
  const isValidToken = decoded && !isExpired(decoded);

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isMasjidRoute = MASJID_ROUTES.some((r) => pathname.startsWith(r));
  const isProtected = isAdminRoute || isMasjidRoute;

  // ── Unauthenticated access to protected route → /login ──────────────────
  if (isProtected && !isValidToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (isValidToken && decoded) {
    const role = decoded.app_metadata?.role;
    const aal = decoded.aal ?? "aal1";

    // ── Admin routes: platform_admin only (aal1 accepted — TOTP disabled) ───
    if (isAdminRoute) {
      if (role !== "platform_admin") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      // TODO: re-enable aal2 check: if (aal !== "aal2") redirect to /login/2fa
    }

    // ── Masjid routes: masjid_admin or platform_admin ─────────────────────
    if (isMasjidRoute && role !== "masjid_admin" && role !== "platform_admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // ── /login while already fully authenticated → redirect to dashboard ──
    if (pathname === "/login" && aal === "aal2") {
      const dest = role === "platform_admin" ? "/admin" : "/masjid/profile";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
