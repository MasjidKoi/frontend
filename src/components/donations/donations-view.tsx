"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, ArrowDownToLine, TrendingUp, Plus, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  donationsApi,
  type AdminDonationItem,
  type DisbursementMethod,
  type MasjidBalance,
} from "@/lib/api/donations";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Refunded", value: "refunded" },
  { label: "Failed", value: "failed" },
];

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-[#D4EDDA] text-[#155724]",
  pending:   "bg-[#FFF3CD] text-[#856404]",
  refunded:  "bg-[#E3EAF2] text-[#34495E]",
  failed:    "bg-[#FFEDED] text-[#C0392B]",
};

function taka(value: string | number) {
  return `৳${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

const EMPTY_PAYOUT = {
  amount: "",
  method: "bank" as DisbursementMethod,
  disbursed_on: today(),
  reference: "",
  notes: "",
};

export function DonationsView({
  mid,
  canManage = false,
}: {
  mid: string;
  canManage?: boolean;
}) {
  const [items, setItems] = useState<AdminDonationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [balance, setBalance] = useState<MasjidBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Payout (disbursement) dialog — platform admin only
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payout, setPayout] = useState(EMPTY_PAYOUT);
  const [savingPayout, setSavingPayout] = useState(false);

  // Refund dialog — platform admin only
  const [refundTarget, setRefundTarget] = useState<AdminDonationItem | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!mid) return;
    setBalanceLoading(true);
    try {
      setBalance(await donationsApi.masjidBalance(mid));
    } catch {
      /* balance is best-effort; the list still renders */
    } finally {
      setBalanceLoading(false);
    }
  }, [mid]);

  const loadDonations = useCallback(
    async (p: number, status: string) => {
      if (!mid) return;
      setLoading(true);
      try {
        const data = await donationsApi.listMasjidDonations(mid, {
          page: p,
          page_size: PAGE_SIZE,
          status: status || undefined,
        });
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch {
        toast.error("Failed to load donations");
      } finally {
        setLoading(false);
      }
    },
    [mid],
  );

  useEffect(() => {
    loadDonations(page, statusFilter);
  }, [page, statusFilter, loadDonations]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const changeFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const submitPayout = async () => {
    const amount = parseFloat(payout.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid payout amount");
      return;
    }
    setSavingPayout(true);
    try {
      await donationsApi.recordDisbursement(mid, {
        amount,
        method: payout.method,
        disbursed_on: payout.disbursed_on,
        reference: payout.reference || null,
        notes: payout.notes || null,
      });
      toast.success("Payout recorded");
      setPayoutOpen(false);
      setPayout(EMPTY_PAYOUT);
      loadBalance();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "Failed to record payout",
      );
    } finally {
      setSavingPayout(false);
    }
  };

  const submitRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      await donationsApi.refund(refundTarget.donation_id, refundReason || "Refund");
      toast.success("Donation refunded");
      setRefundTarget(null);
      setRefundReason("");
      loadDonations(page, statusFilter);
      loadBalance();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "Failed to refund donation",
      );
    } finally {
      setRefunding(false);
    }
  };

  const balanceCards = [
    { label: "Net donations", value: balance?.net_donations, icon: TrendingUp },
    { label: "Total disbursed", value: balance?.total_disbursed, icon: ArrowDownToLine },
    { label: "Current balance", value: balance?.balance, icon: Wallet, accent: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Balance summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {balanceCards.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 sm:p-5 flex flex-col gap-2 ${
              accent
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white border-border/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`} />
              <span className={`text-xs ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
            {balanceLoading ? (
              <Skeleton className={`h-7 w-24 ${accent ? "bg-white/20" : ""}`} />
            ) : (
              <p className="text-xl sm:text-2xl font-bold tabular-nums">
                {taka(value ?? 0)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Filters + payout action */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => changeFilter(value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {canManage && (
          <Button onClick={() => setPayoutOpen(true)} size="sm" className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" /> Record payout
          </Button>
        )}
      </div>

      {/* Donation list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/30 p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {statusFilter ? `No ${statusFilter} donations` : "No donations yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((d) => (
            <div
              key={d.donation_id}
              className="bg-white rounded-xl shadow-sm border border-border/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground text-sm truncate">{d.donor_label}</h3>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                    {d.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(d.completed_at ?? d.created_at)}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-sm font-bold text-foreground tabular-nums">{taka(d.gross_amount)}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">net {taka(d.net_amount)}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${
                    STATUS_STYLES[d.status] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {d.status}
                </span>
                {canManage && d.status === "completed" && (
                  <button
                    onClick={() => {
                      setRefundTarget(d);
                      setRefundReason("");
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Undo2 className="h-3 w-3" /> Refund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} total donations</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-xs px-3 py-1.5 text-muted-foreground">Page {page}</span>
            <button
              disabled={page * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Record-payout dialog */}
      {canManage && (
        <Dialog open={payoutOpen} onOpenChange={(o) => { if (!savingPayout) setPayoutOpen(o); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record payout</DialogTitle>
              <DialogDescription>
                Log a manual disbursement made to this masjid out of band.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Amount (BDT) *</Label>
                  <Input
                    type="number"
                    value={payout.amount}
                    onChange={(e) => setPayout((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="payout-method">Method *</Label>
                  <select
                    id="payout-method"
                    value={payout.method}
                    onChange={(e) => setPayout((f) => ({ ...f, method: e.target.value as DisbursementMethod }))}
                    className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="bank">Bank</option>
                    <option value="bkash">bKash</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Disbursed on *</Label>
                <Input
                  type="date"
                  value={payout.disbursed_on}
                  onChange={(e) => setPayout((f) => ({ ...f, disbursed_on: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Reference (optional)</Label>
                <Input
                  value={payout.reference}
                  onChange={(e) => setPayout((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="Transaction ID / cheque no."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={payout.notes}
                  onChange={(e) => setPayout((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button variant="outline" onClick={() => setPayoutOpen(false)} disabled={savingPayout}>
                  Cancel
                </Button>
                <Button onClick={submitPayout} disabled={savingPayout} className="bg-primary hover:bg-primary/90">
                  {savingPayout ? "Saving…" : "Record payout"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Refund dialog */}
      {canManage && (
        <Dialog open={!!refundTarget} onOpenChange={(o) => { if (!o && !refunding) setRefundTarget(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Refund donation</DialogTitle>
              <DialogDescription>
                Refunds {refundTarget ? taka(refundTarget.gross_amount) : ""} from {refundTarget?.donor_label}.
                The gateway refund and balance reversal happen server-side.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-1">
              <div className="flex flex-col gap-1.5">
                <Label>Reason</Label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                  placeholder="Reason for the refund"
                />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button variant="outline" onClick={() => setRefundTarget(null)} disabled={refunding}>
                  Cancel
                </Button>
                <Button
                  onClick={submitRefund}
                  disabled={refunding}
                  className="bg-[#C0392B] hover:bg-[#a93226] text-white"
                >
                  {refunding ? "Refunding…" : "Confirm refund"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
