import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

export const prayerTimesApi = {
  async get(masjidId: string, params?: { date?: string; days?: number }) {
    const res = await apiClient.get().get(ENDPOINTS.prayerTimes.get(masjidId), { params });
    return res.data;
  },

  async update(masjidId: string, data: Record<string, unknown>) {
    const res = await apiClient.get().put(ENDPOINTS.prayerTimes.update(masjidId), data);
    return res.data;
  },

  async recalc(masjidId: string, data: { date: string; calculation_method?: string; madhab?: string }) {
    const res = await apiClient.get().post(ENDPOINTS.prayerTimes.recalc(masjidId), data);
    return res.data;
  },

  async getJumah(masjidId: string) {
    const res = await apiClient.get().get(ENDPOINTS.prayerTimes.jumah(masjidId));
    return res.data;
  },

  async updateJumah(masjidId: string, data: Record<string, unknown>) {
    const res = await apiClient.get().put(ENDPOINTS.prayerTimes.updateJumah(masjidId), data);
    return res.data;
  },
};
