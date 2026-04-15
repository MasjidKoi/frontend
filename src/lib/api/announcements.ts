import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

export const announcementsApi = {
  async list(masjidId: string, params?: { page?: number; page_size?: number }) {
    const res = await apiClient.get().get(ENDPOINTS.announcements.list(masjidId), { params });
    return res.data;
  },

  async create(masjidId: string, data: { title: string; body: string; publish?: boolean }) {
    const res = await apiClient.get().post(ENDPOINTS.announcements.create(masjidId), data);
    return res.data;
  },

  async update(masjidId: string, id: string, data: { title?: string; body?: string }) {
    const res = await apiClient.get().patch(ENDPOINTS.announcements.update(masjidId, id), data);
    return res.data;
  },

  async publish(masjidId: string, id: string) {
    const res = await apiClient.get().post(ENDPOINTS.announcements.publish(masjidId, id));
    return res.data;
  },

  async delete(masjidId: string, id: string) {
    await apiClient.get().delete(ENDPOINTS.announcements.delete(masjidId, id));
  },
};
