"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { getAccessToken, getRefreshToken } from "@/lib/auth/tokens";
import { isExpired } from "@/lib/auth/jwt";
import { tryRefreshToken } from "@/lib/auth/refresh";
import { toDecodedUser } from "@/lib/auth/jwt";

/**
 * On mount: reads stored tokens from localStorage and hydrates Zustand store.
 * If access token is expired, attempts refresh before giving up.
 * Renders children immediately — loading state is in the store.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setTokens, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const hydrate = async () => {
      const access = getAccessToken();
      const refresh = getRefreshToken();

      if (!access || !refresh) {
        setLoading(false);
        return;
      }

      if (!isExpired(access)) {
        // Token still valid — hydrate store
        setTokens(access, refresh);
        return;
      }

      // Token expired — try to refresh
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const newAccess = getAccessToken()!;
        const newRefresh = getRefreshToken()!;
        setTokens(newAccess, newRefresh);
      } else {
        clearAuth();
      }
    };

    // A malformed/off-spec stored token can make setTokens throw synchronously
    // (e.g. decode succeeds but app_metadata is missing). Without this catch the
    // rejected promise would leave isLoading stuck true forever. clearAuth()
    // resets loading and drops the bad tokens.
    hydrate().catch(() => clearAuth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
