import { config } from "@/lib/config";
import { getRefreshToken, storeTokens } from "@/lib/auth/tokens";
import type { TokenResponse } from "@/types/auth";

let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts to refresh the access token using the stored refresh token.
 * Deduplicates concurrent refresh calls — only one network request fires.
 * Returns true if refresh succeeded, false otherwise.
 */
export async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${config.apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const data: TokenResponse = await response.json();
      storeTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
