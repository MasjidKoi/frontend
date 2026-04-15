import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

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
};
