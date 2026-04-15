import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

export const masjidsApi = {
  async list(params?: { status?: string; q?: string; page?: number; page_size?: number }) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.list, { params });
    return res.data;
  },

  async create(data: {
    name: string;
    address: string;
    admin_region: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    description?: string;
  }) {
    const res = await apiClient.get().post(ENDPOINTS.masjids.create, data);
    return res.data;
  },

  async nearby(params: {
    lat: number;
    lng: number;
    radius_m?: number;
    has_parking?: boolean;
    has_sisters_section?: boolean;
    has_wheelchair_access?: boolean;
  }) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.nearby, { params });
    return res.data;
  },

  async search(q: string) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.search, { params: { q } });
    return res.data;
  },

  async byId(id: string) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.byId(id));
    return res.data;
  },

  async update(id: string, data: Record<string, unknown>) {
    const res = await apiClient.get().patch(ENDPOINTS.masjids.update(id), data);
    return res.data;
  },

  async verify(id: string) {
    const res = await apiClient.get().post(ENDPOINTS.masjids.verify(id));
    return res.data;
  },

  async suspend(id: string, reason: string) {
    const res = await apiClient.get().post(ENDPOINTS.masjids.suspend(id), { reason });
    return res.data;
  },
};
