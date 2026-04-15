export type UserRole = "platform_admin" | "masjid_admin" | "madrasha_admin";
export type Aal = "aal1" | "aal2";

export interface JwtPayload {
  sub: string;
  email: string;
  app_metadata: {
    role: UserRole;
    masjid_id: string | null;
    madrasha_id: string | null;
  };
  aal: Aal;
  exp: number;
  iat: number;
}

export interface DecodedUser {
  userId: string;
  email: string;
  role: UserRole;
  aal: Aal;
  masjidId: string | null;
  madrashaId: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TotpVerifyRequest {
  factor_id: string;
  code: string;
}

export interface TotpEnrollResponse {
  factor_id: string;
  totp_uri: string;
  qr_code: string;
}

export interface AdminInviteRequest {
  email: string;
  role: UserRole;
  masjid_id?: string;
  madrasha_id?: string;
}
