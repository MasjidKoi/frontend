"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, UserPlus, ShieldCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api/admin";
import { masjidsApi } from "@/lib/api/masjids";
import { toast } from "sonner";

interface Stats {
  total_masjids: number;
  active_masjids: number;
  pending_masjids: number;
  suspended_masjids: number;
  verified_masjids: number;
  total_announcements: number;
  published_announcements: number;
}

interface Masjid {
  masjid_id: string;
  name: string;
  admin_region: string;
  status: string;
  verified: boolean;
}

interface AuditEntry {
  action: string;
  target_entity: string;
  admin_email: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-[#D4EDDA] text-[#155724]",
  pending: "bg-[#FFF3CD] text-[#856404]",
  suspended: "bg-[#FFEDED] text-[#C0392B]",
  removed: "bg-muted text-muted-foreground",
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, m, a] = await Promise.all([
          adminApi.getStats(),
          masjidsApi.list({ page_size: 3 }),
          adminApi.getAuditLog({ page_size: 5 }),
        ]);
        setStats(s);
        setMasjids(m.items ?? []);
        setAudit(a.items ?? []);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-8 flex flex-col gap-7">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back — here&apos;s what&apos;s happening today</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white border border-border/40 rounded-lg px-3 py-2 shadow-sm">
          <Calendar className="h-4 w-4" />
          {today}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        )) : (<>
          <div className="bg-white rounded-xl p-5 flex flex-col gap-2 shadow-sm border border-border/30">
            <p className="text-sm text-muted-foreground">Total Masjids</p>
            <p className="font-heading text-4xl font-bold text-foreground">{stats?.total_masjids ?? 0}</p>
            <p className="text-xs text-muted-foreground">
              {stats?.active_masjids} active · {stats?.pending_masjids} pending · {stats?.suspended_masjids} suspended
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 flex flex-col gap-2 shadow-sm border border-border/30">
            <p className="text-sm text-muted-foreground">Verified Masjids</p>
            <p className="font-heading text-4xl font-bold text-foreground">{stats?.verified_masjids ?? 0}</p>
            <p className="text-xs text-muted-foreground">{(stats?.total_masjids ?? 0) - (stats?.verified_masjids ?? 0)} pending verification</p>
          </div>
          <div className="bg-primary rounded-xl p-5 flex flex-col gap-2">
            <p className="text-sm text-secondary/80">Announcements</p>
            <p className="font-heading text-4xl font-bold text-white">{stats?.total_announcements ?? 0}</p>
            <p className="text-xs text-white/50">{stats?.published_announcements ?? 0} published</p>
          </div>
          <div className="bg-white rounded-xl p-5 flex flex-col gap-2 shadow-sm border border-border/30">
            <p className="text-sm text-muted-foreground">Audit Events</p>
            <p className="font-heading text-4xl font-bold text-foreground">{audit.length}</p>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
        </>)}
      </div>

      {/* Bottom row */}
      <div className="flex gap-5">
        {/* Recent masjids */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-border/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <p className="font-semibold text-sm text-foreground">Recent Masjids</p>
            <Link href="/admin/masjids" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {loading ? (
            <div className="p-5 flex flex-col gap-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : masjids.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No masjids yet</p>
          ) : masjids.map((m) => (
            <div key={m.masjid_id} className="flex items-center justify-between px-5 py-3.5 border-b border-border/20 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.admin_region}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[m.status] ?? STATUS_STYLES.pending}`}>
                {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Quick actions + activity */}
        <div className="w-72 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex flex-col gap-3">
            <p className="font-semibold text-sm text-foreground">Quick Actions</p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 gap-2">
              <Link href="/admin/masjids/new"><Plus className="h-4 w-4" /> Add Masjid</Link>
            </Button>
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href="/admin/users"><UserPlus className="h-4 w-4" /> Invite Admin</Link>
            </Button>
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href="/admin/audit-log"><ShieldCheck className="h-4 w-4" /> View Audit Log</Link>
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex flex-col gap-3">
            <p className="font-semibold text-sm text-foreground">Recent Activity</p>
            {loading ? <Skeleton className="h-16" /> : audit.slice(0, 3).map((e, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground font-mono">{e.action}</p>
                  <p className="text-[11px] text-muted-foreground">{timeAgo(e.created_at)} · {e.admin_email?.split("@")[0]}</p>
                </div>
              </div>
            ))}
            {!loading && audit.length === 0 && <p className="text-xs text-muted-foreground">No activity yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
