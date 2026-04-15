"use client";

import { useEffect } from "react";

/**
 * Detects GoTrue email callback hash fragments on any page (usually root /)
 * and redirects to the correct frontend handler page.
 *
 * GoTrue appends tokens as a hash fragment: #access_token=xxx&type=invite
 * When redirect_to is not respected it falls back to GOTRUE_SITE_URL (/).
 */
export function HashRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const type = params.get("type");
    const accessToken = params.get("access_token");

    if (!accessToken) return;

    if (type === "invite") {
      // Use window.location — Next.js router.replace() strips hash fragments
      window.location.href = `/invite/accept${hash}`;
    } else if (type === "recovery") {
      window.location.href = `/password/reset-confirm${hash}`;
    }
  }, [router]);

  return null;
}
