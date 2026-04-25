import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

export interface MasjidReport {
  report_id: string;
  masjid_id: string | null;
  field_name: string;
  description: string;
  reporter_email: string | null;
  status: string;
  created_at: string;
}

export interface MasjidEvent {
  event_id: string;
  masjid_id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  capacity: number | null;
  rsvp_enabled: boolean;
  rsvp_count: number;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  user_id: string;
  rsvp_at: string;
}

export interface Campaign {
  campaign_id: string;
  masjid_id: string;
  title: string;
  description: string | null;
  target_amount: string;
  raised_amount: string;
  progress_pct: number;
  banner_url: string | null;
  start_date: string;
  end_date: string;
  days_remaining: number;
  status: string;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignAnalytics {
  campaign_id: string;
  title: string;
  status: string;
  target_amount: string;
  raised_amount: string;
  progress_pct: number;
  days_remaining: number;
  donor_count: number;
  average_donation: string | null;
}

export interface MasjidReview {
  review_id: string;
  masjid_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  reviewer_display_name: string | null;
  created_at: string;
}

export interface CoAdminInvite {
  invite_id: string;
  masjid_id: string;
  invited_email: string;
  invited_by_email: string | null;
  gotrue_user_id: string | null;
  status: string;
  expires_at: string;
  resend_count: number;
  created_at: string;
  updated_at: string;
}

export interface MasjidPhoto {
  photo_id: string;
  url: string;
  is_cover: boolean;
  display_order: number;
  created_at: string;
}

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

  // Events
  async listEvents(mid: string, params?: { page?: number; page_size?: number }) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.events(mid), { params });
    return res.data as { items: MasjidEvent[]; total: number; page: number; page_size: number };
  },
  async createEvent(mid: string, data: Record<string, unknown>) {
    const res = await apiClient.get().post(ENDPOINTS.masjids.events(mid), data);
    return res.data as MasjidEvent;
  },
  async updateEvent(mid: string, eid: string, data: Record<string, unknown>) {
    const res = await apiClient.get().patch(ENDPOINTS.masjids.eventById(mid, eid), data);
    return res.data as MasjidEvent;
  },
  async deleteEvent(mid: string, eid: string) {
    await apiClient.get().delete(ENDPOINTS.masjids.eventById(mid, eid));
  },
  async listAttendees(mid: string, eid: string, params?: { page?: number; page_size?: number }) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.eventAttendees(mid, eid), { params });
    return res.data as { items: EventAttendee[]; total: number; page: number; page_size: number };
  },

  // Campaigns
  async listCampaigns(mid: string, params?: { page?: number; page_size?: number; status?: string }) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.campaigns(mid), { params });
    return res.data as { items: Campaign[]; total: number; page: number; page_size: number };
  },
  async createCampaign(mid: string, data: Record<string, unknown>) {
    const res = await apiClient.get().post(ENDPOINTS.masjids.campaigns(mid), data);
    return res.data as Campaign;
  },
  async updateCampaign(mid: string, cid: string, data: Record<string, unknown>) {
    const res = await apiClient.get().patch(ENDPOINTS.masjids.campaignById(mid, cid), data);
    return res.data as Campaign;
  },
  async getCampaignAnalytics(mid: string, cid: string) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.campaignAnalytics(mid, cid));
    return res.data as CampaignAnalytics;
  },

  // Reviews
  async listReviews(mid: string, params?: { page?: number; page_size?: number }) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.reviews(mid), { params });
    return res.data as { items: MasjidReview[]; total: number; average_rating: number | null };
  },
  async deleteReview(mid: string, rid: string) {
    await apiClient.get().delete(ENDPOINTS.masjids.reviewById(mid, rid));
  },

  // Co-admins
  async listCoAdmins(mid: string, params?: { page?: number; page_size?: number }) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.coAdmins(mid), { params });
    return res.data as { items: CoAdminInvite[]; total: number };
  },
  async inviteCoAdmin(mid: string, email: string) {
    const res = await apiClient.get().post(ENDPOINTS.masjids.coAdminInvite(mid), { email });
    return res.data as CoAdminInvite;
  },
  async resendCoAdminInvite(mid: string, iid: string) {
    const res = await apiClient.get().post(ENDPOINTS.masjids.coAdminResend(mid, iid));
    return res.data as CoAdminInvite;
  },
  async revokeCoAdmin(mid: string, uid: string) {
    await apiClient.get().delete(ENDPOINTS.masjids.coAdminRevoke(mid, uid));
  },

  // Photos
  async uploadPhoto(mid: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await apiClient.get().post(ENDPOINTS.masjids.photos(mid), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as MasjidPhoto;
  },
  async deletePhoto(mid: string, pid: string) {
    await apiClient.get().delete(ENDPOINTS.masjids.photoById(mid, pid));
  },
  async setCoverPhoto(mid: string, pid: string) {
    const res = await apiClient.get().post(ENDPOINTS.masjids.photoCover(mid, pid));
    return res.data as MasjidPhoto[];
  },
  async reorderPhotos(mid: string, orderedIds: string[]) {
    const res = await apiClient.get().put(ENDPOINTS.masjids.photoReorder(mid), { ordered_photo_ids: orderedIds });
    return res.data as MasjidPhoto[];
  },
  async downloadExport(format: "csv" | "pdf", params?: { status?: string; admin_region?: string; verified?: boolean }) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.export, {
      params: { format, ...params },
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `masjids-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  },
  async listReports(params?: { page?: number; page_size?: number; status?: string; masjid_id?: string }) {
    const res = await apiClient.get().get(ENDPOINTS.masjids.reports, { params });
    return res.data as { items: MasjidReport[]; total: number; page: number; page_size: number };
  },
  async updateReport(id: string, data: { status: "reviewed" | "resolved" }) {
    const res = await apiClient.get().patch(ENDPOINTS.masjids.report(id), data);
    return res.data as MasjidReport;
  },
  async bulkImportFields() {
    const res = await apiClient.get().get(ENDPOINTS.masjids.bulkImportFields);
    return res.data as { required: string[]; optional: string[] };
  },
  async bulkImport(file: File, fieldMap?: Record<string, string>) {
    const fd = new FormData();
    fd.append("file", file);
    if (fieldMap) fd.append("field_map", JSON.stringify(fieldMap));
    const res = await apiClient.get().post(ENDPOINTS.masjids.bulkImport, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as { created: number; failed: number; errors: { row: number; reason: string }[]; import_file_key: string };
  },
  async merge(sourceMasjidId: string, targetMasjidId: string) {
    const res = await apiClient.get().post(ENDPOINTS.masjids.merge, {
      source_masjid_id: sourceMasjidId,
      target_masjid_id: targetMasjidId,
      copy_fields: [],
    });
    return res.data;
  },
};
