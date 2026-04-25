"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { masjidsApi, type CoAdminInvite } from "@/lib/api/masjids";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-[#FFF3CD] text-[#7a5500]",
  accepted: "bg-[#D4EDDA] text-[#155724]",
  declined: "bg-[#FFEDED] text-[#C0392B]",
  expired:  "bg-muted text-muted-foreground",
};

export default function AdminMasjidCoAdminsPage() {
  const { id: mid } = useParams<{ id: string }>();
  const [invites, setInvites] = useState<CoAdminInvite[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await masjidsApi.listCoAdmins(mid, { page_size: 50 });
      setInvites(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { toast.error("Failed to load co-admins"); }
    finally { setLoading(false); }
  }, [mid]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Co-admins</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} invite{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border/30 overflow-x-auto">
        <div className="grid grid-cols-[2fr_1fr_120px_120px] gap-4 px-5 h-11 bg-muted/50 items-center border-b border-border/30">
          {["Email", "Status", "Invited", "Accepted"].map(h => (
            <p key={h} className="text-xs font-semibold text-muted-foreground">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : invites.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">No co-admin invites</p>
          </div>
        ) : invites.map(inv => (
          <div key={inv.invite_id} className="grid grid-cols-[2fr_1fr_120px_120px] gap-4 px-5 py-3.5 items-center border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors">
            <p className="text-sm text-foreground font-medium">{inv.invited_email}</p>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit capitalize ${STATUS_STYLES[inv.status] ?? "bg-muted text-muted-foreground"}`}>
              {inv.status}
            </span>
            <p className="text-xs text-muted-foreground">
              {new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {inv.status === "accepted"
                ? new Date(inv.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
