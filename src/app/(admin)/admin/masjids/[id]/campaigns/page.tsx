"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { BarChart2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { masjidsApi, type Campaign, type CampaignAnalytics } from "@/lib/api/masjids";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  Active:    "bg-[#D4EDDA] text-[#155724]",
  Completed: "bg-[#D4EDDA] text-[#155724]",
  Cancelled: "bg-[#FFEDED] text-[#C0392B]",
};

export default function AdminMasjidCampaignsPage() {
  const { id: mid } = useParams<{ id: string }>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [analyticsTarget, setAnalyticsTarget] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await masjidsApi.listCampaigns(mid, { page: p, page_size: PAGE_SIZE });
      setCampaigns(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { toast.error("Failed to load campaigns"); }
    finally { setLoading(false); }
  }, [mid, page]);

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAnalytics = async (c: Campaign) => {
    setAnalyticsTarget(c);
    setAnalyticsLoading(true);
    try {
      const data = await masjidsApi.getCampaignAnalytics(mid, c.campaign_id);
      setAnalytics(data);
    } catch { toast.error("Failed to load analytics"); }
    finally { setAnalyticsLoading(false); }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Campaigns</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Fundraising campaigns for this masjid</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/30 p-10 text-center">
          <p className="text-muted-foreground text-sm">No campaigns</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {campaigns.map(c => (
            <div key={c.campaign_id} className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[c.status] ?? "bg-muted text-muted-foreground"}`}>
                  {c.status}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>৳{parseFloat(c.raised_amount).toLocaleString()} raised</span>
                  <span>Goal: ৳{parseFloat(c.target_amount).toLocaleString()}</span>
                </div>
                <Progress value={c.progress_pct} className="h-2" />
                <p className="text-xs text-muted-foreground">{c.progress_pct.toFixed(1)}%</p>
              </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} —{" "}
                    {new Date(c.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <button
                    onClick={() => openAnalytics(c)}
                    className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <BarChart2 className="h-3 w-3" /> Analytics
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} total campaigns</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">← Previous</button>
            <span className="text-xs px-3 py-1.5 text-muted-foreground">Page {page}</span>
            <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
          </div>
        </div>
      )}

      <Dialog open={!!analyticsTarget} onOpenChange={open => !open && setAnalyticsTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Analytics — {analyticsTarget?.title}</DialogTitle>
            <DialogDescription>Donation breakdown</DialogDescription>
          </DialogHeader>
          {analyticsLoading ? (
            <div className="flex flex-col gap-2 mt-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : !analytics ? (
            <p className="text-sm text-muted-foreground mt-2">No analytics data</p>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">৳{parseFloat(analytics.raised_amount).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Raised</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{analytics.donor_count}</p>
                  <p className="text-xs text-muted-foreground">Donors</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {analytics.average_donation ? `৳${parseFloat(analytics.average_donation).toLocaleString()}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Donation</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
