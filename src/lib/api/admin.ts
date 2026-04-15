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
};
