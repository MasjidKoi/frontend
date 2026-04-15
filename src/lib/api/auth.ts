import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AdminInviteRequest,
  LoginRequest,
  TokenResponse,
  TotpEnrollResponse,
  TotpVerifyRequest,
} from "@/types/auth";

export const authApi = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const res = await apiClient.get().post<TokenResponse>(ENDPOINTS.auth.login, data);
    return res.data;
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const res = await apiClient.get().post<TokenResponse>(ENDPOINTS.auth.refresh, {
      refresh_token: refreshToken,
    });
    return res.data;
  },

  async logout(): Promise<void> {
    await apiClient.get().post(ENDPOINTS.auth.logout);
  },

  async enroll2fa(): Promise<TotpEnrollResponse> {
    const res = await apiClient.get().post<TotpEnrollResponse>(ENDPOINTS.auth.enroll);
    return res.data;
  },

  async verify2fa(data: TotpVerifyRequest): Promise<TokenResponse> {
    const res = await apiClient.get().post<TokenResponse>(ENDPOINTS.auth.verify, data);
    return res.data;
  },

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.get().post(ENDPOINTS.auth.passwordReset, { email });
  },

  async inviteAdmin(data: AdminInviteRequest) {
    const res = await apiClient.get().post(ENDPOINTS.auth.adminInvite, data);
    return res.data;
  },
};
