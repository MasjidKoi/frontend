"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { adminApi, type SupportTicket } from "@/lib/api/admin";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const STATUSES = ["All", "Open", "InProgress", "Resolved"];
const CATEGORIES = ["All", "Bug", "IncorrectData", "FeatureRequest", "Other"];

const STATUS_STYLES: Record<string, string> = {
  Open:       "bg-[#FFF3CD] text-[#7a5500]",
  InProgress: "bg-[#CCE5FF] text-[#004085]",
  Resolved:   "bg-[#D4EDDA] text-[#155724]",
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SupportPage() {
  const [items, setItems] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [updateOpen, setUpdateOpen] = useState(false);
  const [target, setTarget] = useState<SupportTicket | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [assignedEmail, setAssignedEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await adminApi.listSupportTickets({
        page: p,
        page_size: PAGE_SIZE,
        status: statusFilter !== "All" ? statusFilter : undefined,
        category: categoryFilter !== "All" ? categoryFilter : undefined,
      });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter]);

  useEffect(() => { load(1); setPage(1); }, [statusFilter, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openUpdate = (ticket: SupportTicket) => {
    setTarget(ticket);
    setNewStatus(ticket.status);
    setAssignedEmail(ticket.assigned_to_email ?? "");
    setUpdateOpen(true);
  };

  const handleUpdate = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      await adminApi.updateSupportTicket(target.ticket_id, {
        status: newStatus,
        assigned_to_email: assignedEmail || null,
      });
      toast.success("Ticket updated");
      setUpdateOpen(false);
      load(page);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and resolve user-submitted support requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="h-9 rounded-md border border-input bg-white pl-3 pr-8 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === "All" ? "All Status" : s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="h-9 rounded-md border border-input bg-white pl-3 pr-8 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 overflow-x-auto">
        <div className="grid grid-cols-[2fr_1fr_1fr_120px_120px] gap-4 px-5 h-11 bg-muted/50 items-center border-b border-border/30">
          {["Subject", "Category", "Status", "Submitted", "Actions"].map(h => (
            <p key={h} className="text-xs font-semibold text-muted-foreground">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">No tickets found</p>
          </div>
        ) : items.map(t => (
          <div key={t.ticket_id} className="grid grid-cols-[2fr_1fr_1fr_120px_120px] gap-4 px-5 py-3.5 items-center border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors">
            <div>
              <p className="text-sm font-medium text-foreground">{t.subject ?? <span className="text-muted-foreground italic">No subject</span>}</p>
              <p className="text-xs text-muted-foreground truncate">{t.user_email ?? t.user_id.slice(0, 16)}</p>
            </div>
            <p className="text-sm text-secondary-foreground">{t.category}</p>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${STATUS_STYLES[t.status] ?? "bg-muted text-muted-foreground"}`}>
              {t.status}
            </span>
            <p className="text-xs text-muted-foreground">{timeAgo(t.created_at)}</p>
            <button
              onClick={() => openUpdate(t)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors w-fit"
            >
              Update
            </button>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} total tickets</p>
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

      {/* Update dialog */}
      <Dialog open={updateOpen} onOpenChange={open => { if (!submitting) setUpdateOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Ticket</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            {target && (
              <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{target.subject ?? "No subject"}</p>
                <p className="mt-1 text-xs">{target.description}</p>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <div className="relative">
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-white pl-3 pr-8 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {["Open", "InProgress", "Resolved"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Assigned To (email, optional)</Label>
              <Input
                value={assignedEmail}
                onChange={e => setAssignedEmail(e.target.value)}
                placeholder="admin@example.com"
                type="email"
              />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleUpdate} disabled={submitting} className="bg-primary hover:bg-primary/90">
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
