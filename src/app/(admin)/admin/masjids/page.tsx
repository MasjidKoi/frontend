"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, ChevronDown, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { masjidsApi } from "@/lib/api/masjids";
import { toast } from "sonner";

interface Masjid {
  masjid_id: string;
  name: string;
  address: string;
  admin_region: string;
  status: string;
  verified: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-[#D4EDDA] text-[#155724]",
  pending:   "bg-[#FFF3CD] text-[#856404]",
  suspended: "bg-[#FFEDED] text-[#C0392B]",
  removed:   "bg-muted text-muted-foreground",
};

const STATUSES = ["All", "active", "pending", "suspended", "removed"];

export default function MasjidsPage() {
  const router = useRouter();
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [suspendReason, setSuspendReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await masjidsApi.list({
        q: q || undefined,
        status: status === "All" ? undefined : status,
        page_size: 50,
      });
      setMasjids(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load masjids");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (id: string) => {
    try {
      await masjidsApi.verify(id);
      toast.success("Masjid verified");
      load();
    } catch { toast.error("Failed to verify"); }
  };

  const handleSuspend = async (id: string) => {
    const reason = prompt("Reason for suspension (min 10 chars):");
    if (!reason || reason.length < 10) { toast.error("Reason too short"); return; }
    try {
      await masjidsApi.suspend(id, reason);
      toast.success("Masjid suspended");
      load();
    } catch { toast.error("Failed to suspend"); }
  };

  const handleUnsuspend = async (id: string) => {
    try {
      await masjidsApi.update(id, { status: "active" });
      toast.success("Masjid unsuspended");
      load();
    } catch { toast.error("Failed to unsuspend"); }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Masjid Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create, verify and manage masjid accounts</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 gap-2">
          <Link href="/admin/masjids/new"><Plus className="h-4 w-4" /> Add Masjid</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search masjids..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-white pl-3 pr-8 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 overflow-hidden">
        {/* Head */}
        <div className="grid grid-cols-[2fr_1fr_120px_100px_1fr] gap-4 px-5 h-11 bg-muted/50 items-center border-b border-border/30">
          {["Masjid Name", "Region", "Status", "Verified", "Actions"].map(h => (
            <p key={h} className="text-xs font-semibold text-muted-foreground">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : masjids.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">No masjids found</p>
            <Link href="/admin/masjids/new" className="text-accent text-sm hover:underline mt-1 block">Create the first one →</Link>
          </div>
        ) : masjids.map(m => (
          <div key={m.masjid_id} className="grid grid-cols-[2fr_1fr_120px_100px_1fr] gap-4 px-5 py-3.5 items-center border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors">
            <div>
              <p className="text-sm font-medium text-foreground">{m.name}</p>
              <p className="text-xs text-muted-foreground truncate">{m.address}</p>
            </div>
            <p className="text-sm text-secondary-foreground">{m.admin_region}</p>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${STATUS_STYLES[m.status] ?? STATUS_STYLES.pending}`}>
              {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
            </span>
            <div className="flex items-center gap-1.5">
              {m.verified
                ? <><BadgeCheck className="h-4 w-4 text-accent" /><span className="text-xs text-accent">Verified</span></>
                : <span className="text-sm text-muted-foreground">—</span>
              }
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/admin/masjids/${m.masjid_id}`)}
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors"
              >View</button>
              {!m.verified && m.status === "active" && (
                <button
                  onClick={() => handleVerify(m.masjid_id)}
                  className="text-xs px-3 py-1.5 rounded-md bg-secondary text-primary font-medium hover:bg-secondary/80 transition-colors"
                >Verify</button>
              )}
              {m.status === "active" && (
                <button
                  onClick={() => handleSuspend(m.masjid_id)}
                  className="text-xs px-3 py-1.5 rounded-md bg-[#FFEDED] text-[#C0392B] hover:bg-[#ffd9d9] transition-colors"
                >Suspend</button>
              )}
              {m.status === "suspended" && (
                <button
                  onClick={() => handleUnsuspend(m.masjid_id)}
                  className="text-xs px-3 py-1.5 rounded-md bg-muted text-accent hover:bg-muted/80 transition-colors"
                >Unsuspend</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {total > 0 && <p className="text-xs text-muted-foreground">{total} total masjids</p>}
    </div>
  );
}
