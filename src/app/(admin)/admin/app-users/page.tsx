"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminApi, type AppUser } from "@/lib/api/admin";
import { toast } from "sonner";

const PAGE_SIZE = 20;

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AppUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const [suspendTarget, setSuspendTarget] = useState<AppUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [unsuspendingId, setUnsuspendingId] = useState<string | null>(null);

  const load = useCallback(async (p = page, search = q) => {
    setLoading(true);
    try {
      const data = await adminApi.listAppUsers({ search: search || undefined, page: p, page_size: PAGE_SIZE });
      setUsers(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load app users");
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => { load(page, q); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, q);
  };

  const handleSuspend = async () => {
    if (!suspendTarget || suspendReason.length < 1) return;
    setSuspendLoading(true);
    try {
      await adminApi.suspendAppUser(suspendTarget.user_id, suspendReason);
      toast.success(`${suspendTarget.display_name ?? "User"} suspended`);
      setSuspendTarget(null);
      load(page, q);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to suspend");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleUnsuspend = async (user: AppUser) => {
    setUnsuspendingId(user.user_id);
    try {
      await adminApi.unsuspendAppUser(user.user_id);
      toast.success(`${user.display_name ?? "User"} unsuspended`);
      load(page, q);
    } catch {
      toast.error("Failed to unsuspend");
    } finally {
      setUnsuspendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteAppUser(deleteTarget.user_id);
      toast.success("User deleted");
      setDeleteTarget(null);
      load(page, q);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">App Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Mobile app users — suspend, unsuspend, or remove accounts</p>
        </div>
        {total > 0 && (
          <span className="text-sm text-muted-foreground bg-white border border-border/40 rounded-lg px-3 py-1.5 shadow-sm">
            {total} total users
          </span>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by display name…"
            aria-label="Search app users"
            value={q}
            onChange={e => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 overflow-x-auto">
        <div className="grid grid-cols-[2fr_100px_100px_120px_160px] gap-4 px-5 h-11 bg-muted/50 items-center border-b border-border/30">
          {["Display Name", "Status", "Madhab", "Joined", "Actions"].map(h => (
            <p key={h} className="text-xs font-semibold text-muted-foreground">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">No app users registered yet</p>
            <p className="text-xs text-muted-foreground mt-1">Users appear here after their first mobile app login</p>
          </div>
        ) : users.map(u => (
          <div
            key={u.user_id}
            className="grid grid-cols-[2fr_100px_100px_120px_160px] gap-4 px-5 py-3.5 items-center border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{u.display_name ?? <span className="text-muted-foreground">—</span>}</p>
              <p className="text-xs text-muted-foreground font-mono">{u.user_id.slice(0, 8)}…</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${
              u.is_suspended
                ? "bg-[#FFEDED] text-[#C0392B]"
                : "bg-[#D4EDDA] text-[#155724]"
            }`}>
              {u.is_suspended ? "Suspended" : "Active"}
            </span>
            <p className="text-sm text-muted-foreground capitalize">{u.madhab ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{timeAgo(u.created_at)}</p>
            <div className="flex gap-2">
              {u.is_suspended ? (
                <button
                  onClick={() => handleUnsuspend(u)}
                  disabled={unsuspendingId === u.user_id}
                  className="text-xs px-3 py-1.5 rounded-md bg-muted text-accent hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unsuspendingId === u.user_id ? "Unsuspending…" : "Unsuspend"}
                </button>
              ) : (
                <button
                  onClick={() => { setSuspendTarget(u); setSuspendReason(""); }}
                  className="text-xs px-3 py-1.5 rounded-md bg-[#FFEDED] text-[#C0392B] hover:bg-[#ffd9d9] transition-colors"
                >
                  Suspend
                </button>
              )}
              <button
                onClick={() => setDeleteTarget(u)}
                aria-label="Delete user"
                className="text-xs px-2 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-muted-foreground transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} total users</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >← Previous</button>
            <span className="text-xs px-3 py-1.5 text-muted-foreground">Page {page}</span>
            <button
              disabled={page * PAGE_SIZE >= total}
              onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Next →</button>
          </div>
        </div>
      )}

      {/* Suspend dialog */}
      <Dialog
        open={!!suspendTarget}
        onOpenChange={open => { if (!suspendLoading && !open) setSuspendTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Provide a reason for suspending <strong>{suspendTarget?.display_name ?? "this user"}</strong>. Their account will be locked immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Reason *</Label>
            <Textarea
              placeholder="Enter reason for suspension…"
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{suspendReason.length}/500</p>
          </div>
          <DialogFooter showCloseButton>
            <Button
              onClick={handleSuspend}
              disabled={suspendReason.length < 1 || suspendLoading}
              className="bg-[#C0392B] hover:bg-[#a93226] text-white"
            >
              {suspendLoading ? "Suspending…" : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.display_name ?? "this user"}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete their profile and remove their GoTrue account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[#C0392B] hover:bg-[#a93226] text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
