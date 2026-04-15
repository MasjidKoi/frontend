import { jwtDecode } from "jwt-decode";
import type { DecodedUser, JwtPayload } from "@/types/auth";

export function decodeToken(token: string): JwtPayload {
  return jwtDecode<JwtPayload>(token);
}

export function isExpired(token: string): boolean {
  try {
    const { exp } = decodeToken(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

export function toDecodedUser(token: string): DecodedUser {
  const payload = decodeToken(token);
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.app_metadata.role,
    aal: payload.aal,
    masjidId: payload.app_metadata.masjid_id,
    madrashaId: payload.app_metadata.madrasha_id,
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
