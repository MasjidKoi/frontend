/**
 * All backend API endpoint paths, grouped by feature domain.
 * Import this wherever you need a path — never hardcode URLs in components.
 */
export const ENDPOINTS = {
  auth: {
    login:         "/auth/login",
    refresh:       "/auth/refresh",
    logout:        "/auth/logout",
    enroll:        "/auth/2fa/enroll",
    verify:        "/auth/2fa/verify",
    passwordReset: "/auth/password/reset",
    adminInvite:   "/auth/admin/invite",
    factors:       "/auth/2fa/factors",
    updatePassword: "/auth/user/password",
  },

  masjids: {
    list:    "/masjids",
    create:  "/masjids",
    nearby:  "/masjids/nearby",
    search:  "/masjids/search",
    byId:    (id: string) => `/masjids/${id}`,
    update:  (id: string) => `/masjids/${id}`,
    verify:  (id: string) => `/masjids/${id}/verify`,
    suspend: (id: string) => `/masjids/${id}/suspend`,
  },

  prayerTimes: {
    get:        (masjidId: string) => `/masjids/${masjidId}/prayer-times`,
    update:     (masjidId: string) => `/masjids/${masjidId}/prayer-times`,
    recalc:     (masjidId: string) => `/masjids/${masjidId}/prayer-times/recalc`,
    jumah:      (masjidId: string) => `/masjids/${masjidId}/jumah`,
    updateJumah:(masjidId: string) => `/masjids/${masjidId}/jumah`,
  },

  announcements: {
    list:        (masjidId: string) => `/masjids/${masjidId}/announcements`,
    listAdmin:   (masjidId: string) => `/masjids/${masjidId}/announcements/admin`,
    create:      (masjidId: string) => `/masjids/${masjidId}/announcements`,
    byId:        (masjidId: string, id: string) => `/masjids/${masjidId}/announcements/${id}`,
    update:      (masjidId: string, id: string) => `/masjids/${masjidId}/announcements/${id}`,
    publish:     (masjidId: string, id: string) => `/masjids/${masjidId}/announcements/${id}/publish`,
    delete:      (masjidId: string, id: string) => `/masjids/${masjidId}/announcements/${id}`,
  },

  admin: {
    stats:                "/admin/stats",
    auditLog:             "/admin/audit-log",
    announcements:        "/admin/announcements",
  },
} as const;
