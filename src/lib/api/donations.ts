import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";

// ── Types (mirror app/schemas/donation.py & disbursement.py) ──────────────────

export type DonationStatus = "pending" | "completed" | "refunded" | "failed";

export interface AdminDonationItem {
  donation_id: string;
  // "Anonymous donor" where is_anonymous, the donor's name otherwise — the mask
  // is applied server-side, so the client never sees a concealed identity.
  donor_label: string;
  category: string;
  gross_amount: string;
  net_amount: string;
  status: DonationStatus;
  created_at: string;
  completed_at: string | null;
}

export interface AdminDonationListResponse {
  items: AdminDonationItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface MasjidBalance {
  masjid_id: string;
  net_donations: string;
  total_disbursed: string;
  balance: string;
}

export interface MasjidBalanceItem extends MasjidBalance {
  masjid_name: string;
}

export type DisbursementMethod = "bank" | "bkash" | "cash";

export interface Disbursement {
  disbursement_id: string;
  masjid_id: string;
  amount: string;
  method: string;
  reference: string | null;
  disbursed_on: string;
  notes: string | null;
  created_at: string;
}

export interface DonationStatusResponse {
  donation_id: string;
  status: DonationStatus;
  category: string;
  masjid_id: string;
  campaign_id: string | null;
  gross_amount: string;
  fee_amount: string;
  net_amount: string;
  is_anonymous: boolean;
  receipt_number: string | null;
  gateway_payment_method: string | null;
  completed_at: string | null;
  created_at: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const donationsApi = {
  /** Masjid-scoped donations. masjid_admin: own masjid; platform_admin: any. */
  async listMasjidDonations(
    mid: string,
    params?: { status?: string; page?: number; page_size?: number },
  ) {
    const res = await apiClient.get().get(ENDPOINTS.donations.masjidDonations(mid), { params });
    return res.data as AdminDonationListResponse;
  },

  /** A masjid's derived balance: net completed donations − recorded payouts. */
  async masjidBalance(mid: string) {
    const res = await apiClient.get().get(ENDPOINTS.donations.masjidBalance(mid));
    return res.data as MasjidBalance;
  },

  /** Per-masjid balances across the platform (platform_admin only). */
  async allBalances() {
    const res = await apiClient.get().get(ENDPOINTS.donations.balances);
    return res.data as { items: MasjidBalanceItem[] };
  },

  /** Record a manual payout against a masjid's balance (platform_admin only). */
  async recordDisbursement(
    mid: string,
    data: {
      amount: number;
      method: DisbursementMethod;
      disbursed_on: string;
      reference?: string | null;
      notes?: string | null;
    },
  ) {
    const res = await apiClient.get().post(ENDPOINTS.donations.disbursements(mid), data);
    return res.data as Disbursement;
  },

  /** Refund a completed donation: gateway refund + balance/campaign reversal. */
  async refund(donationId: string, reason: string) {
    const res = await apiClient.get().post(ENDPOINTS.donations.refund(donationId), { reason });
    return res.data as DonationStatusResponse;
  },
};
