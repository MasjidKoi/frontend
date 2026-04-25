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

    events:             (mid: string) => `/masjids/${mid}/events`,
    eventById:          (mid: string, eid: string) => `/masjids/${mid}/events/${eid}`,
    eventAttendees:     (mid: string, eid: string) => `/masjids/${mid}/events/${eid}/attendees`,

    campaigns:          (mid: string) => `/masjids/${mid}/campaigns`,
    campaignById:       (mid: string, cid: string) => `/masjids/${mid}/campaigns/${cid}`,
    campaignAnalytics:  (mid: string, cid: string) => `/masjids/${mid}/campaigns/${cid}/analytics`,

    reviews:            (mid: string) => `/masjids/${mid}/reviews`,
    reviewById:         (mid: string, rid: string) => `/masjids/${mid}/reviews/${rid}`,

    coAdmins:           (mid: string) => `/masjids/${mid}/co-admins`,
    coAdminInvite:      (mid: string) => `/masjids/${mid}/co-admins/invite`,
    coAdminResend:      (mid: string, iid: string) => `/masjids/${mid}/co-admins/${iid}/resend`,
    coAdminRevoke:      (mid: string, uid: string) => `/masjids/${mid}/co-admins/${uid}`,

    photos:             (mid: string) => `/masjids/${mid}/photos`,
    photoById:          (mid: string, pid: string) => `/masjids/${mid}/photos/${pid}`,
    photoCover:         (mid: string, pid: string) => `/masjids/${mid}/photos/${pid}/cover`,
    photoReorder:       (mid: string) => `/masjids/${mid}/photos/reorder`,
    export:             "/masjids/export",
    reports:            "/masjids/reports",
    report:             (id: string) => `/masjids/reports/${id}`,
    bulkImportFields:   "/masjids/bulk-import/fields",
    bulkImport:         "/masjids/bulk-import",
    merge:              "/masjids/merge",
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
    stats:         "/admin/stats",
    auditLog:      "/admin/audit-log",
    announcements: "/admin/announcements",
    appUsers:      "/admin/app-users",
    suspendUser:   (id: string) => `/admin/app-users/${id}/suspend`,
    unsuspendUser: (id: string) => `/admin/app-users/${id}/unsuspend`,
    deleteUser:    (id: string) => `/admin/app-users/${id}`,
    settings:       "/admin/settings",
    userGrowth:     "/admin/analytics/user-growth",
    support:        "/admin/support/tickets",
    supportTicket:  (id: string) => `/admin/support/tickets/${id}`,
  },
} as const;
