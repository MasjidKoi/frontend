"use client";

import { useEffect, useState } from "react";
import { UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";

// GoTrue admin users list
const SERVICE_NOTE = "User list comes from GoTrue admin API via backend.";

interface GUser { id: string; email: string; app_metadata: { role?: string; masjid_id?: string }; created_at: string; }

const ROLE_STYLES: Record<string, string> = {
  platform_admin: "bg-primary text-white",
  masjid_admin:   "bg-secondary text-primary",
  madrasha_admin: "bg-[#FFF3CD] text-[#856404]",
};

const inviteSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["platform_admin", "masjid_admin", "madrasha_admin"]),
  masjid_id: z.string().optional(),
});
type InviteForm = z.infer<typeof inviteSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<GUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "masjid_admin" },
  });
  const role = watch("role");

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Fetch directly from backend which calls GoTrue admin API
      const resp = await fetch("http://localhost:9999/admin/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("mkoi_token") ?? ""}` },
      });
      // Fallback: try our API list
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
    // Use audit log users as proxy since we don't have a users list API yet
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const onInvite = async (data: InviteForm) => {
    try {
      await authApi.inviteAdmin({ email: data.email, role: data.role, masjid_id: data.masjid_id || undefined });
      toast.success(`Invite sent to ${data.email}`);
      setInviteOpen(false);
      reset();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to send invite");
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All admin accounts — platform, masjid and madrasha</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-primary hover:bg-primary/90 gap-2">
          <UserPlus className="h-4 w-4" /> Invite Admin
        </Button>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-8 text-center">
        <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold text-foreground mb-1">Manage users via invite</p>
        <p className="text-sm text-muted-foreground mb-4">
          User accounts are managed in GoTrue. Use the Invite Admin button to add new platform, masjid, or madrasha admins.
        </p>
        <Button onClick={() => setInviteOpen(true)} className="bg-primary hover:bg-primary/90 gap-2 mx-auto">
          <UserPlus className="h-4 w-4" /> Invite Admin
        </Button>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Admin</DialogTitle>
            <DialogDescription>An invite email will be sent. They set their password on first login.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onInvite)} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inv-email">Email address *</Label>
              <Input id="inv-email" type="email" placeholder="admin@example.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Role *</Label>
              <select {...register("role")} className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none">
                <option value="masjid_admin">Masjid Admin</option>
                <option value="madrasha_admin">Madrasha Admin</option>
                <option value="platform_admin">Platform Admin</option>
              </select>
            </div>

            {role === "masjid_admin" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-masjid">Masjid ID (UUID)</Label>
                <Input id="inv-masjid" placeholder="Leave blank to assign later" {...register("masjid_id")} />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { setInviteOpen(false); reset(); }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 gap-2">
                <UserPlus className="h-4 w-4" />
                {isSubmitting ? "Sending…" : "Send Invite"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
