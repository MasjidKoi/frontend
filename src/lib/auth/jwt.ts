import { jwtDecode } from "jwt-decode";
import type { DecodedUser, JwtPayload } from "@/types/auth";

export function decodeToken(token: string): JwtPayload {
  return jwtDecode<JwtPayload>(token);
}

// Treat a token as expired slightly before its real exp so a token accepted
// client-side isn't then rejected by the backend mid-request.
const CLOCK_SKEW_MS = 30_000;

export function isExpired(token: string): boolean {
  try {
    const { exp } = decodeToken(token);
    if (!exp) return true; // a token with no exp is not trustworthy — treat as expired
    return Date.now() >= exp * 1000 - CLOCK_SKEW_MS;
  } catch {
    return true;
  }
}

export function toDecodedUser(token: string): DecodedUser {
  const payload = decodeToken(token);
  const meta = payload.app_metadata;
  // Guard the nested dereference: a decodable-but-off-spec token (no app_metadata)
  // would otherwise throw a raw TypeError. Throw a controlled error the caller
  // (AuthProvider) can catch and clear auth on.
  if (!meta) throw new Error("Token payload missing app_metadata");
  return {
    userId: payload.sub,
    email: payload.email,
    role: meta.role,
    aal: payload.aal,
    masjidId: meta.masjid_id,
    madrashaId: meta.madrasha_id,
  };
}

export function getRedirectPath(
  role: DecodedUser["role"],
  aal: DecodedUser["aal"],
): string {
  if (role === "platform_admin") {
    return aal === "aal2" ? "/admin" : "/login/2fa";
  }
  return "/masjid/profile";
}
