const TOKEN_KEY = "mkoi_token";
const REFRESH_KEY = "mkoi_refresh";
// Keep cookie in sync so proxy.ts (edge runtime) can read it for route protection
const COOKIE_MAX_AGE = 60 * 60; // 1 hour — matches GoTrue default

function setCookie(value: string): void {
  // Add Secure over HTTPS so the token cookie is never sent on a plaintext hop.
  // NOTE: this cookie is written from client JS (so proxy.ts can read it at the
  // edge) and therefore cannot be HttpOnly. Moving token storage to a server-set
  // HttpOnly cookie (and dropping localStorage) is the real hardening — tracked
  // as part of unifying the API ingress. SameSite=Strict already blocks CSRF.
  const secure =
    typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict${secure}`;
}

function deleteCookie(): void {
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function storeTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  setCookie(access);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  deleteCookie();
}
