import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

export interface AppUser {
  user_id: string;
  display_name: string | null;
  madhab: string | null;
  profile_photo_url: string | null;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface PlatformSettings {
  settings_id: string;
  default_madhab: string;
  default_calc_method: string;
  supported_countries: string[] | null;
  reviews_enabled: boolean;
  checkins_enabled: boolean;
  platform_name: string;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  terms_of_service: string | null;
  privacy_policy: string | null;
  terms_version: string | null;
  updated_at: string;
  updated_by_email: string | null;
}

export interface SupportTicket {
  ticket_id: string;
  user_id: string;
  user_email: string | null;
  category: string;
  subject: string | null;
  description: string | null;
  status: string;
  assigned_to: string | null;
  assigned_to_email: string | null;
  created_at: string;
  updated_at: string;
}

export const adminApi = {
  async getStats() {
    const res = await apiClient.get().get(ENDPOINTS.admin.stats);
    return res.data;
  },

  async getAuditLog(params?: { page?: number; page_size?: number }) {
    const res = await apiClient.get().get(ENDPOINTS.admin.auditLog, { params });
    return res.data;
  },

  async listUsers() {
    const res = await apiClient.get().get("/admin/users");
    return res.data as { users: Array<{ id: string; email: string; role: string; masjid_id: string | null; created_at: string; confirmed_at: string | null; invited_at: string | null }>; total: number };
  },

  async listAppUsers(params?: { search?: string; page?: number; page_size?: number }) {
    const res = await apiClient.get().get(ENDPOINTS.admin.appUsers, { params });
    return res.data as { items: AppUser[]; total: number; page: number; page_size: number };
  },

  async suspendAppUser(id: string, reason: string) {
    const res = await apiClient.get().post(ENDPOINTS.admin.suspendUser(id), { reason });
    return res.data as AppUser;
  },

  async unsuspendAppUser(id: string) {
    const res = await apiClient.get().post(ENDPOINTS.admin.unsuspendUser(id));
    return res.data as AppUser;
  },

  async deleteAppUser(id: string) {
    await apiClient.get().delete(ENDPOINTS.admin.deleteUser(id));
  },

  async getSettings() {
    const res = await apiClient.get().get(ENDPOINTS.admin.settings);
    return res.data as PlatformSettings;
  },

  async updateSettings(data: Partial<PlatformSettings>) {
    const res = await apiClient.get().patch(ENDPOINTS.admin.settings, data);
    return res.data as PlatformSettings;
  },

  async getUserGrowth(period: "daily" | "weekly" | "monthly") {
    const res = await apiClient.get().get(ENDPOINTS.admin.userGrowth, { params: { period } });
    return res.data as { data: { period: string; count: number }[]; period: string };
  },

  async listSupportTickets(params?: { page?: number; page_size?: number; status?: string; category?: string }) {
    const res = await apiClient.get().get(ENDPOINTS.admin.support, { params });
    return res.data as { items: SupportTicket[]; total: number; page: number; page_size: number };
  },

  async updateSupportTicket(id: string, data: { status?: string; assigned_to_email?: string | null }) {
    const res = await apiClient.get().patch(ENDPOINTS.admin.supportTicket(id), data);
    return res.data as SupportTicket;
  },
};
