import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from "axios";
import { config } from "@/lib/config";
import { clearTokens, getAccessToken } from "@/lib/auth/tokens";
import { tryRefreshToken } from "@/lib/auth/refresh";

// Extend axios config to track retry attempts
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

class ApiClientService {
  private instance: AxiosInstance | null = null;

  /** Returns the singleton axios instance, creating it on first call. */
  get(): AxiosInstance {
    if (!this.instance) {
      this.instance = this.create();
    }
    return this.instance;
  }

  /**
   * Clears the cached instance — call after setTokens() so the next request
   * picks up the new Authorization header from localStorage.
   */
  reset(): void {
    this.instance = null;
  }

  private create(): AxiosInstance {
    const ax = axios.create({
      baseURL: config.apiUrl,
      timeout: 15_000,
      headers: { "Content-Type": "application/json" },
    });

    // ── Request: attach Bearer token (skip if already explicitly set) ────────
    ax.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      // Don't override if the caller passed an explicit Authorization header
      if (token && !cfg.headers.Authorization) {
        cfg.headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    });

    // ── Response: handle 401 with one refresh + retry ─────────────────────
    ax.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshed = await tryRefreshToken();
          if (refreshed) {
            originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
            return ax(originalRequest);
          }

          // Refresh failed — clear tokens and redirect to login
          clearTokens();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      },
    );

    return ax;
  }
}

export const apiClient = new ApiClientService();
