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

/**
 * Decode a JWT payload WITHOUT verifying its signature — Edge runtime safe.
 *
 * SECURITY: because the signature is not checked, the role/aal claims derived
 * here are forgeable and this gate must NOT be treated as the authorization
 * boundary — it only decides which SPA shell to render. The FastAPI backend
 * verifies the signature on every data request, which is the real gate.
 * Hardening TODO: verify the signature against the backend JWKS/secret using
 * `jose` (Edge-compatible) before trusting any claim.
 */
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
  // A token with no exp claim is not trustworthy — treat it as expired so a
  // forged/unbounded token can't linger. (Signature is still NOT verified here;
  // see the security note on parseToken.)
  if (!payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const tokenValue = request.cookies.get(TOKEN_COOKIE)?.value;
  const decoded = tokenValue ? parseToken(tokenValue) : null;
  const isValidToken = decoded && !isExpired(decoded);

  // Use exact prefix matching to avoid /masjids (public) being caught by /masjid,
  // and to avoid a hypothetical /admin-* route being caught by /admin.
  const isAdminRoute = pathname.startsWith("/admin/") || pathname === "/admin";
  const isMasjidRoute = pathname.startsWith("/masjid/") || pathname === "/masjid";
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

    // ── /login while already authenticated → redirect to dashboard ─────────
    // Check any valid token (aal1 or aal2) since TOTP is currently disabled
    if (pathname === "/login") {
      const dest = role === "platform_admin" ? "/admin" : "/masjid/profile";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|ico|gif|webp|avif|woff2?)$).*)",
  ],
};
