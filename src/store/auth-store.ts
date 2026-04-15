import { create } from "zustand";
import { apiClient } from "@/lib/api/client";
import { storeTokens, clearTokens } from "@/lib/auth/tokens";
import { toDecodedUser } from "@/lib/auth/jwt";
import type { DecodedUser } from "@/types/auth";

interface AuthStore {
  user: DecodedUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** Store tokens, decode user, reset axios singleton. */
  setTokens: (access: string, refresh: string) => void;

  /** Clear all auth state + tokens. */
  clearAuth: () => void;

  /** Used by AuthProvider to set loading state while hydrating from storage. */
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: (access, refresh) => {
    storeTokens(access, refresh);
    apiClient.reset(); // force interceptor to pick up new token
    const user = toDecodedUser(access);
    set({ user, accessToken: access, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    clearTokens();
    apiClient.reset();
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
