"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { masjidsApi, type Campaign, type CampaignAnalytics } from "@/lib/api/masjids";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  Active:    "bg-[#D4EDDA] text-[#155724]",
  Completed: "bg-[#D1ECF1] text-[#0C5460]",
  Cancelled: "bg-[#FFEDED] text-[#C0392B]",
};

function today() {
  return new Date().toISOString().split("T")[0];
}

function futureDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const EMPTY_FORM = {
  title: "", description: "", target_amount: "", banner_url: "",
  start_date: today(), end_date: futureDate(30), status: "",
};

export default function CampaignsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const mid = user?.masjidId ?? "";

  useEffect(() => {
    if (!authLoading && !mid) router.push("/login");
  }, [authLoading, mid, router]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [analyticsTarget, setAnalyticsTarget] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const load = useCallback(async (p = page) => {
    if (!mid) return;
    setLoading(true);
    try {
      const data = await masjidsApi.listCampaigns(mid, { page: p, page_size: PAGE_SIZE });
      setCampaigns(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { toast.error("Failed to load campaigns"); }
    finally { setLoading(false); }
  }, [mid, page]);

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditTarget(c);
    setForm({
      title: c.title,
      description: c.description ?? "",
      target_amount: c.target_amount,
      banner_url: c.banner_url ?? "",
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.target_amount) {
      toast.error("Title and target amount are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || null,
        target_amount: parseFloat(form.target_amount),
        banner_url: form.banner_url || null,
        start_date: form.start_date,
        end_date: form.end_date,
      };
      if (editTarget) {
        if (form.status) payload.status = form.status;
        await masjidsApi.updateCampaign(mid, editTarget.campaign_id, payload);
        toast.success("Campaign updated");
      } else {
        await masjidsApi.createCampaign(mid, payload);
        toast.success("Campaign created");
      }
      setFormOpen(false);
      load(page);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const openAnalytics = async (c: Campaign) => {
    setAnalyticsTarget(c);
    setAnalytics(null);
    setAnalyticsLoading(true);
    try {
      const data = await masjidsApi.getCampaignAnalytics(mid, c.campaign_id);
      setAnalytics(data);
    } catch { toast.error("Failed to load analytics"); }
    finally { setAnalyticsLoading(false); }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Fundraising campaigns for your masjid</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-border/30 p-10 text-center">
          <p className="text-muted-foreground text-sm">No campaigns yet</p>
          <button onClick={openCreate} className="text-accent text-sm hover:underline mt-1">Create the first one →</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {campaigns.map(c => (
            <div key={c.campaign_id} className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base">{c.title}</h3>
                  {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.description}</p>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[c.status] ?? ""}`}>
                  {c.status}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>BDT {parseFloat(c.raised_amount).toLocaleString()} raised</span>
                  <span>BDT {parseFloat(c.target_amount).toLocaleString()} goal</span>
                </div>
                <Progress value={Math.min(c.progress_pct, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">{c.progress_pct.toFixed(1)}% · {c.days_remaining > 0 ? `${c.days_remaining} days left` : "Ended"}</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {c.start_date} → {c.end_date}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openAnalytics(c)}
                    className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <BarChart2 className="h-3 w-3" /> Analytics
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                </div>
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

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={open => { if (!submitting) setFormOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Campaign" : "New Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-1">
            <div className="flex flex-col gap-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Campaign title" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="resize-none" placeholder="What is this campaign for?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Target Amount (BDT) *</Label>
                <Input type="number" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} placeholder="0.00" min={0} step="0.01" />
              </div>
              {editTarget && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="campaign-status">Status</Label>
                  <select id="campaign-status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>End Date *</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Banner URL (optional)</Label>
              <Input value={form.banner_url} onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? "Saving…" : editTarget ? "Save Changes" : "Create Campaign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics dialog */}
      <Dialog open={!!analyticsTarget} onOpenChange={open => !open && setAnalyticsTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Campaign Analytics</DialogTitle>
            <DialogDescription className="truncate">{analyticsTarget?.title}</DialogDescription>
          </DialogHeader>
          {analyticsLoading ? (
            <div className="flex flex-col gap-3 mt-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { label: "Status", value: analytics.status },
                { label: "Donors", value: String(analytics.donor_count) },
                { label: "Raised", value: `BDT ${parseFloat(analytics.raised_amount).toLocaleString()}` },
                { label: "Target", value: `BDT ${parseFloat(analytics.target_amount).toLocaleString()}` },
                { label: "Progress", value: `${analytics.progress_pct.toFixed(1)}%` },
                { label: "Avg Donation", value: analytics.average_donation ? `BDT ${parseFloat(analytics.average_donation).toLocaleString()}` : "—" },
                { label: "Days Left", value: analytics.days_remaining > 0 ? String(analytics.days_remaining) : "Ended" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/40 rounded-lg p-3 flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
