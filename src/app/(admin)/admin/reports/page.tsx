"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { masjidsApi, type MasjidReport } from "@/lib/api/masjids";
import { toast } from "sonner";

const PAGE_SIZE = 20;
const STATUSES = ["All", "pending", "reviewed", "resolved"];

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-[#FFF3CD] text-[#7a5500]",
  reviewed: "bg-[#CCE5FF] text-[#004085]",
  resolved: "bg-[#D4EDDA] text-[#155724]",
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ReportsPage() {
  const [items, setItems] = useState<MasjidReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await masjidsApi.listReports({
        page: p,
        page_size: PAGE_SIZE,
        status: statusFilter !== "All" ? statusFilter : undefined,
      });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(1); setPage(1); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = async (report: MasjidReport, status: "reviewed" | "resolved") => {
    setUpdating(prev => new Set(prev).add(report.report_id));
    try {
      await masjidsApi.updateReport(report.report_id, { status });
      toast.success(`Marked as ${status}`);
      load(page);
    } catch {
      toast.error("Failed to update report");
    } finally {
      setUpdating(prev => { const s = new Set(prev); s.delete(report.report_id); return s; });
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Masjid Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">User-submitted accuracy reports for masjid listings</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="h-9 rounded-md border border-input bg-white pl-3 pr-8 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 overflow-x-auto">
        <div className="grid grid-cols-[1fr_2fr_1fr_120px_200px] gap-4 px-5 h-11 bg-muted/50 items-center border-b border-border/30">
          {["Field", "Description", "Status", "Submitted", "Actions"].map(h => (
            <p key={h} className="text-xs font-semibold text-muted-foreground">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">No reports found</p>
          </div>
        ) : items.map(r => {
          const busy = updating.has(r.report_id);
          return (
            <div key={r.report_id} className="grid grid-cols-[1fr_2fr_1fr_120px_200px] gap-4 px-5 py-3.5 items-center border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors">
              <p className="text-sm font-medium text-foreground truncate">{r.field_name}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${STATUS_STYLES[r.status] ?? "bg-muted text-muted-foreground"}`}>
                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </span>
              <p className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
              <div className="flex gap-2">
                {r.status === "pending" && (
                  <button
                    disabled={busy}
                    onClick={() => handleUpdate(r, "reviewed")}
                    className="text-xs px-2.5 py-1.5 rounded-md bg-[#CCE5FF] text-[#004085] hover:bg-[#b8d7ff] transition-colors disabled:opacity-40"
                  >
                    Mark Reviewed
                  </button>
                )}
                {(r.status === "pending" || r.status === "reviewed") && (
                  <button
                    disabled={busy}
                    onClick={() => handleUpdate(r, "resolved")}
                    className="text-xs px-2.5 py-1.5 rounded-md bg-[#D4EDDA] text-[#155724] hover:bg-[#c3e6cb] transition-colors disabled:opacity-40"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} total reports</p>
          {total > PAGE_SIZE && (
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">← Previous</button>
              <span className="text-xs px-3 py-1.5 text-muted-foreground">Page {page}</span>
              <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
