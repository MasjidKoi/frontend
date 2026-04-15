"use client";

import { useEffect, useState, useCallback } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api/auth";
import { adminApi } from "@/lib/api/admin";
import { masjidsApi } from "@/lib/api/masjids";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  masjid_id: string | null;
  created_at: string;
  confirmed_at: string | null;
  invited_at: string | null;
}

interface Masjid { masjid_id: string; name: string; admin_region: string; }

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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "masjid_admin" },
  });
  const role = watch("role");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, m] = await Promise.all([
        adminApi.listUsers(),
        masjidsApi.list({ page_size: 200 }),
      ]);
      setUsers(u.users ?? []);
      setMasjids(m.items ?? []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getMasjidName = (id: string | null) => {
    if (!id) return "—";
    return masjids.find(m => m.masjid_id === id)?.name ?? id.slice(0, 8) + "…";
  };

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
      load();
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

      {/* User table */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_2fr_100px] gap-4 px-5 h-11 bg-muted/50 items-center border-b border-border/30">
          {["Email", "Role", "Scoped To", "Status"].map(h => (
            <p key={h} className="text-xs font-semibold text-muted-foreground">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No admin users yet</p>
            <button onClick={() => setInviteOpen(true)} className="text-accent text-sm hover:underline mt-1">Invite the first admin →</button>
          </div>
        ) : users.map(u => (
          <div key={u.id} className="grid grid-cols-[2fr_1fr_2fr_100px] gap-4 px-5 py-3.5 items-center border-b border-border/10 last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {u.email?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="text-sm text-foreground truncate">{u.email}</span>
            </div>
            <div>
              {u.role ? (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_STYLES[u.role] ?? "bg-muted text-muted-foreground"}`}>
                  {u.role}
                </span>
              ) : <span className="text-sm text-muted-foreground">—</span>}
            </div>
            <span className="text-sm text-muted-foreground truncate">{getMasjidName(u.masjid_id)}</span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${u.confirmed_at ? "bg-[#D4EDDA] text-[#155724]" : "bg-[#FFF3CD] text-[#856404]"}`}>
              {u.confirmed_at ? "Active" : "Invited"}
            </span>
          </div>
        ))}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Admin</DialogTitle>
            <DialogDescription>An invite email will be sent via Brevo. They set their password on first login.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onInvite)} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inv-email">Email address *</Label>
              <Input id="inv-email" type="email" placeholder="admin@example.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Role *</Label>
              <select {...register("role")} className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
                <option value="masjid_admin">Masjid Admin</option>
                <option value="madrasha_admin">Madrasha Admin</option>
                <option value="platform_admin">Platform Admin</option>
              </select>
            </div>

            {role === "masjid_admin" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-masjid">Assign to Masjid</Label>
                <select id="inv-masjid" {...register("masjid_id")} className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="">— Select a masjid (optional) —</option>
                  {masjids.map(m => (
                    <option key={m.masjid_id} value={m.masjid_id}>{m.name} · {m.admin_region}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">The masjid_id is embedded in their JWT so they can only manage this masjid.</p>
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
