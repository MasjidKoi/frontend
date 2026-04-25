"use client";

import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api/admin";
import { toast } from "sonner";

interface AuditEntry {
  log_id: string;
  action: string;
  target_entity: string | null;
  target_id: string | null;
  admin_email: string | null;
  admin_role: string;
  ip_address: string | null;
  created_at: string;
}

const ACTION_COLOR: Record<string, string> = {
  create_masjid:    "bg-[#D4EDDA]",
  verify_masjid:    "bg-[#D4EDDA]",
  suspend_masjid:   "bg-[#FFEDED]",
  set_prayer_times: "bg-[#FFF3CD]",
  recalc_prayer_times: "bg-[#FFF3CD]",
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLog({ page, page_size: PAGE_SIZE });
      setEntries(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All admin write actions — append-only, immutable</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border/30 overflow-x-auto">
        {/* Head */}
        <div className="grid grid-cols-[2fr_1fr_2fr_1fr] gap-4 px-5 h-11 bg-muted/50 items-center border-b border-border/30">
          {["Action", "Target", "Admin", "Timestamp"].map(h => (
            <p key={h} className="text-xs font-semibold text-muted-foreground">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="px-5 py-12 text-sm text-muted-foreground text-center">No audit entries yet</p>
        ) : entries.map(e => (
          <div key={e.log_id} className="grid grid-cols-[2fr_1fr_2fr_1fr] gap-4 px-5 py-3.5 items-center border-b border-border/10 last:border-0">
            <div className="flex items-center gap-2.5">
              <span className={`h-2 w-2 rounded-full shrink-0 ${ACTION_COLOR[e.action] ? "" : "bg-accent"}`}
                style={{ backgroundColor: ACTION_COLOR[e.action] ? undefined : undefined }}
              >
                <span className={`block h-2 w-2 rounded-full ${e.action.includes("suspend") || e.action.includes("delete") ? "bg-[#C0392B]" : "bg-accent"}`} />
              </span>
              <span className="text-sm font-mono font-medium text-foreground">{e.action}</span>
            </div>
            <span className="text-sm text-muted-foreground">{e.target_entity ?? "—"}</span>
            <span className="text-sm text-muted-foreground truncate">{e.admin_email ?? e.admin_role}</span>
            <span className="text-sm text-muted-foreground">{timeAgo(e.created_at)}</span>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} total entries</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >← Previous</button>
            <span className="text-xs px-3 py-1.5 text-muted-foreground">Page {page}</span>
            <button
              disabled={page * PAGE_SIZE >= total}
              onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
