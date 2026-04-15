"use client";

import { useEffect, useState } from "react";
import { UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api/auth";
import { masjidsApi } from "@/lib/api/masjids";
import { toast } from "sonner";

interface Masjid { masjid_id: string; name: string; admin_region: string; }

const inviteSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["platform_admin", "masjid_admin", "madrasha_admin"]),
  masjid_id: z.string().optional(),
});
type InviteForm = z.infer<typeof inviteSchema>;

export default function UsersPage() {
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "masjid_admin" },
  });
  const role = watch("role");

  // Load masjids for the dropdown
  useEffect(() => {
    masjidsApi.list({ page_size: 200 })
      .then(d => setMasjids(d.items ?? []))
      .catch(() => {});
  }, []);

  const onInvite = async (data: InviteForm) => {
    try {
      await authApi.inviteAdmin({
        email: data.email,
        role: data.role,
        masjid_id: data.role === "masjid_admin" ? data.masjid_id : undefined,
      });
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
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-10 flex flex-col items-center text-center gap-4">
        <Mail className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-semibold text-foreground mb-1">Manage users via invite</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            User accounts are managed in GoTrue. Use the Invite Admin button to add new platform, masjid, or madrasha admins.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-primary hover:bg-primary/90 gap-2">
          <UserPlus className="h-4 w-4" /> Invite Admin
        </Button>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Admin</DialogTitle>
            <DialogDescription>An invite email will be sent via Brevo. They set their password on first login.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onInvite)} className="flex flex-col gap-4 mt-2">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inv-email">Email address *</Label>
              <Input
                id="inv-email"
                type="email"
                placeholder="admin@example.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <Label>Role *</Label>
              <select
                {...register("role")}
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="masjid_admin">Masjid Admin</option>
                <option value="madrasha_admin">Madrasha Admin</option>
                <option value="platform_admin">Platform Admin</option>
              </select>
            </div>

            {/* Masjid dropdown — only for masjid_admin */}
            {role === "masjid_admin" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-masjid">Assign to Masjid</Label>
                <select
                  id="inv-masjid"
                  {...register("masjid_id")}
                  className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">— Select a masjid (optional) —</option>
                  {masjids.map(m => (
                    <option key={m.masjid_id} value={m.masjid_id}>
                      {m.name} · {m.admin_region}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">The masjid_id will be embedded in their JWT — they can only manage this masjid.</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { setInviteOpen(false); reset(); }}>
                Cancel
              </Button>
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
