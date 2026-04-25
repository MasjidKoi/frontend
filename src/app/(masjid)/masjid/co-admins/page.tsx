"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { masjidsApi, type CoAdminInvite } from "@/lib/api/masjids";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-[#FFF3CD] text-[#7a5500]",
  accepted: "bg-[#D4EDDA] text-[#155724]",
  declined: "bg-[#FFEDED] text-[#C0392B]",
  expired:  "bg-muted text-muted-foreground",
};

function timeUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  if (h < 1) return `${Math.floor(ms / 60000)}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function CoAdminsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const mid = user?.masjidId ?? "";

  useEffect(() => {
    if (!authLoading && !mid) router.push("/login");
  }, [authLoading, mid, router]);

  const [invites, setInvites] = useState<CoAdminInvite[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<CoAdminInvite | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!mid) return;
    setLoading(true);
    try {
      const data = await masjidsApi.listCoAdmins(mid, { page_size: 50 });
      setInvites(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch { toast.error("Failed to load co-admins"); }
    finally { setLoading(false); }
  }, [mid]);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await masjidsApi.inviteCoAdmin(mid, inviteEmail.trim());
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail("");
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleResend = async (inv: CoAdminInvite) => {
    setResendingId(inv.invite_id);
    try {
      await masjidsApi.resendCoAdminInvite(mid, inv.invite_id);
      toast.success("Invite resent");
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to resend");
    } finally {
      setResendingId(null);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      const uid = revokeTarget.gotrue_user_id ?? revokeTarget.invite_id;
      await masjidsApi.revokeCoAdmin(mid, uid);
      toast.success("Co-admin access revoked");
      setRevokeTarget(null);
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to revoke");
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Co-admins</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Invite others to help manage this masjid</p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-sm text-muted-foreground bg-white border border-border/40 rounded-lg px-3 py-1.5 shadow-sm">
              {total} total
            </span>
          )}
          <Button onClick={() => { setInviteEmail(""); setInviteOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" /> Invite Co-admin
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border/30 overflow-x-auto">
        <div className="grid grid-cols-[2fr_100px_100px_80px_160px] gap-4 px-5 h-11 bg-muted/50 items-center border-b border-border/30">
          {["Email", "Status", "Expires", "Resent", "Actions"].map(h => (
            <p key={h} className="text-xs font-semibold text-muted-foreground">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : invites.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">No co-admins yet</p>
            <p className="text-xs text-muted-foreground mt-1">Invite someone to help manage this masjid</p>
          </div>
        ) : invites.map(inv => (
          <div
            key={inv.invite_id}
            className="grid grid-cols-[2fr_100px_100px_80px_160px] gap-4 px-5 py-3.5 items-center border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{inv.invited_email}</p>
              {inv.invited_by_email && (
                <p className="text-xs text-muted-foreground">by {inv.invited_by_email}</p>
              )}
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit capitalize ${STATUS_STYLES[inv.status] ?? STATUS_STYLES.expired}`}>
              {inv.status}
            </span>
            <p className="text-sm text-muted-foreground">{timeUntil(inv.expires_at)}</p>
            <p className="text-sm text-muted-foreground">{inv.resend_count}×</p>
            <div className="flex gap-2">
              {inv.status === "pending" && inv.resend_count < 3 && (
                <button
                  onClick={() => handleResend(inv)}
                  disabled={resendingId === inv.invite_id}
                  className="text-xs px-3 py-1.5 rounded-md border border-border bg-white hover:bg-muted text-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="h-3 w-3" /> {resendingId === inv.invite_id ? "Resending…" : "Resend"}
                </button>
              )}
              <button
                onClick={() => setRevokeTarget(inv)}
                aria-label="Revoke access"
                className="text-xs px-2 py-1.5 rounded-md border border-border bg-white hover:bg-[#FFEDED] hover:text-[#C0392B] hover:border-[#C0392B]/30 text-muted-foreground transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={open => { if (!inviting) setInviteOpen(open); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Co-admin</DialogTitle>
            <DialogDescription>
              They&apos;ll receive an email to set up their account and access this masjid.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label>Email address *</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="admin@example.com"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>Cancel</Button>
              <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting} className="bg-primary hover:bg-primary/90">
                {inviting ? "Sending…" : "Send Invite"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm */}
      <AlertDialog open={!!revokeTarget} onOpenChange={open => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access for &quot;{revokeTarget?.invited_email}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Their co-admin access to this masjid will be removed immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-[#C0392B] hover:bg-[#a93226] text-white">Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
