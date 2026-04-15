const TOKEN_KEY = "mkoi_token";
const REFRESH_KEY = "mkoi_refresh";
// Keep cookie in sync so proxy.ts (edge runtime) can read it for route protection
const COOKIE_MAX_AGE = 60 * 60; // 1 hour — matches GoTrue default

function setCookie(value: string): void {
  document.cookie = `${TOKEN_KEY}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`;
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
