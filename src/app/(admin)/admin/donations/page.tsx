"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Wallet, ArrowDownToLine, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { donationsApi, type MasjidBalanceItem } from "@/lib/api/donations";
import { toast } from "sonner";

function taka(value: string | number) {
  return `৳${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export default function AdminDonationsOverviewPage() {
  const router = useRouter();
  const [items, setItems] = useState<MasjidBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await donationsApi.allBalances();
      // Highest outstanding balance first — that's what needs disbursing.
      const sorted = (data.items ?? []).slice().sort((a, b) => Number(b.balance) - Number(a.balance));
      setItems(sorted);
    } catch {
      toast.error("Failed to load balances");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, m) => ({
          net: acc.net + Number(m.net_donations),
          disbursed: acc.disbursed + Number(m.total_disbursed),
          balance: acc.balance + Number(m.balance),
        }),
        { net: 0, disbursed: 0, balance: 0 },
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((m) => m.masjid_name.toLowerCase().includes(needle));
  }, [items, q]);

  const summaryCards = [
    { label: "Total net donations", value: totals.net, icon: TrendingUp },
    { label: "Total disbursed", value: totals.disbursed, icon: ArrowDownToLine },
    { label: "Outstanding balance", value: totals.balance, icon: Wallet, accent: true },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Donations &amp; Balances</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Net donations, payouts, and outstanding balances across all masjids
        </p>
      </div>

      {/* Platform totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {summaryCards.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 sm:p-5 flex flex-col gap-2 ${
              accent ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`} />
              <span className={`text-xs ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
            {loading ? (
              <Skeleton className={`h-7 w-28 ${accent ? "bg-white/20" : ""}`} />
            ) : (
              <p className="text-xl sm:text-2xl font-bold tabular-nums">{taka(value)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search masjids..."
          aria-label="Search masjids"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border/30 overflow-x-auto">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 px-5 h-11 bg-muted/50 items-center border-b border-border/30 min-w-[760px] md:min-w-0">
          {["Masjid", "Net donations", "Disbursed", "Balance", ""].map((h, i) => (
            <p
              key={h || i}
              className={`text-xs font-semibold text-muted-foreground ${i > 0 && i < 4 ? "text-right" : ""}`}
            >
              {h}
            </p>
          ))}
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {q ? "No masjids match your search" : "No balances yet"}
            </p>
          </div>
        ) : (
          filtered.map((m) => (
            <div
              key={m.masjid_id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3.5 items-center border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors min-w-[760px] md:min-w-0"
            >
              <p className="text-sm font-medium text-foreground truncate">{m.masjid_name}</p>
              <p className="text-sm text-secondary-foreground text-right tabular-nums">{taka(m.net_donations)}</p>
              <p className="text-sm text-secondary-foreground text-right tabular-nums">{taka(m.total_disbursed)}</p>
              <p className="text-sm font-semibold text-foreground text-right tabular-nums">{taka(m.balance)}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => router.push(`/admin/masjids/${m.masjid_id}/donations`)}
                  className="text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {!loading && items.length > 0 && (
        <p className="text-xs text-muted-foreground">{items.length} masjids with donation activity</p>
      )}
    </div>
  );
}
