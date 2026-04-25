"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api/admin";
import { toast } from "sonner";

type Period = "daily" | "weekly" | "monthly";

function formatLabel(p: string, period: Period): string {
  const d = new Date(p);
  if (period === "monthly") {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const CHART_H = 180;

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [data, setData] = useState<{ period: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState<{ madhab: string | null; is_deleted: boolean }[]>([]);
  const [demoLoading, setDemoLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.getUserGrowth(period)
      .then(res => setData(res.data ?? []))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    adminApi.listAppUsers({ page_size: 1000 })
      .then(res => setDemoUsers(res.items ?? []))
      .catch(() => toast.error("Failed to load demographics"))
      .finally(() => setDemoLoading(false));
  }, []);

  const total = data.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const peak = data.reduce((best, d) => d.count > best.count ? d : best, { period: "", count: 0 });

  const activeUsers = demoUsers.filter(u => !u.is_deleted);
  const madhabCounts = activeUsers.reduce<Record<string, number>>((acc, u) => {
    const key = u.madhab ?? "Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const madhabTotal = activeUsers.length;

  const exportGrowthCSV = () => {
    const csv = ["Period,Count", ...data.map(d => `${d.period},${d.count}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-growth-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">User registration growth over time</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportGrowthCSV}
            disabled={data.length === 0}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>

          {/* Period switcher */}
          <div className="flex gap-1 bg-white border border-border/30 rounded-lg p-1 shadow-sm">
            {(["daily", "weekly", "monthly"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  period === p
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) : (<>
          <div className="bg-white rounded-xl p-4 flex flex-col gap-1.5 shadow-sm border border-border/30">
            <p className="text-xs text-muted-foreground">Total Registrations</p>
            <p className="font-heading text-2xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground capitalize">{period} view</p>
          </div>
          <div className="bg-white rounded-xl p-4 flex flex-col gap-1.5 shadow-sm border border-border/30">
            <p className="text-xs text-muted-foreground">Peak {period === "daily" ? "Day" : period === "weekly" ? "Week" : "Month"}</p>
            <p className="font-heading text-2xl font-bold text-foreground">{peak.count}</p>
            <p className="text-xs text-muted-foreground">{peak.period ? formatLabel(peak.period, period) : "—"}</p>
          </div>
          <div className="bg-white rounded-xl p-4 flex flex-col gap-1.5 shadow-sm border border-border/30">
            <p className="text-xs text-muted-foreground">Range</p>
            <p className="font-heading text-lg font-bold text-foreground leading-tight">
              {data.length > 0
                ? `${formatLabel(data[0].period, period)} — ${formatLabel(data[data.length - 1].period, period)}`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{data.length} {period} buckets</p>
          </div>
        </>)}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-foreground text-sm">
          User Registrations — <span className="capitalize">{period}</span>
        </h2>

        {loading ? (
          <Skeleton className="h-[220px] rounded-lg" />
        ) : data.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No registration data yet</p>
          </div>
        ) : (
          <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ height: `${CHART_H + 40}px` }}>
            {data.map(d => (
              <div key={d.period} className="flex-1 min-w-[24px] flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-mono">{d.count > 0 ? d.count : ""}</span>
                <div
                  title={`${formatLabel(d.period, period)}: ${d.count} users`}
                  className="w-full bg-primary/70 hover:bg-primary rounded-t transition-colors cursor-default"
                  style={{ height: `${Math.max((d.count / maxCount) * CHART_H, d.count > 0 ? 4 : 2)}px` }}
                />
                <span className="text-[10px] text-muted-foreground text-center truncate w-full leading-tight">
                  {formatLabel(d.period, period)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demographics */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-foreground text-sm">User Demographics — Madhab</h2>
        {demoLoading ? (
          <Skeleton className="h-32 rounded-lg" />
        ) : madhabTotal === 0 ? (
          <p className="text-sm text-muted-foreground">No users registered yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(madhabCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([madhab, count]) => (
                <div key={madhab} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground capitalize w-24 shrink-0">{madhab}</span>
                  <div className="flex-1 bg-muted/40 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(count / madhabTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-28 text-right shrink-0">
                    {count} · {((count / madhabTotal) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
