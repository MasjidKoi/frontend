"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { masjidsApi } from "@/lib/api/masjids";
import { prayerTimesApi } from "@/lib/api/prayer-times";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Facilities {
  has_sisters_section: boolean;
  has_wudu_area: boolean;
  has_wudu_male: boolean;
  has_wudu_female: boolean;
  has_wheelchair_access: boolean;
  has_parking: boolean;
  parking_capacity: number | null;
  has_janazah: boolean;
  has_school: boolean;
  imam_name: string | null;
  imam_qualifications: string | null;
}

interface Contact {
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  website_url: string | null;
}

interface MasjidDetail {
  masjid_id: string;
  name: string;
  address: string;
  admin_region: string;
  timezone: string;
  status: string;
  verified: boolean;
  donations_enabled: boolean;
  description: string | null;
  suspension_reason: string | null;
  latitude: number;
  longitude: number;
  facilities: Facilities | null;
  contact: Contact | null;
}

interface PrayerTime { fajr_azan: string; dhuhr_azan: string; asr_azan: string; maghrib_azan: string; isha_azan: string; }

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-[#D4EDDA] text-[#155724]",
  pending:   "bg-[#FFF3CD] text-[#7a5500]",
  suspended: "bg-[#FFEDED] text-[#C0392B]",
  removed:   "bg-muted text-muted-foreground",
};

const FACILITY_LABELS: { key: keyof Facilities; label: string }[] = [
  { key: "has_sisters_section", label: "Sisters Section" },
  { key: "has_wudu_area", label: "Wudu Area" },
  { key: "has_wudu_male", label: "Wudu — Male" },
  { key: "has_wudu_female", label: "Wudu — Female" },
  { key: "has_wheelchair_access", label: "Wheelchair Access" },
  { key: "has_parking", label: "Parking" },
  { key: "has_janazah", label: "Janazah Facility" },
  { key: "has_school", label: "Islamic School" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function MasjidDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  type FormState = Partial<MasjidDetail> & { facilities?: Partial<Facilities>; contact?: Partial<Contact> };
  const [masjid, setMasjid] = useState<MasjidDetail | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [mergeLoading, setMergeLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, pt] = await Promise.all([
        masjidsApi.byId(id),
        prayerTimesApi.get(id, { days: 1 }).then(d => d.dates?.[0] ?? null).catch(() => null),
      ]);
      setMasjid(m);
      setForm({
        name: m.name,
        address: m.address,
        admin_region: m.admin_region,
        timezone: m.timezone,
        description: m.description,
        facilities: { ...m.facilities },
        contact: { ...m.contact },
      });
      setPrayerTimes(pt);
    } catch {
      toast.error("Failed to load masjid");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const set = (field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value } as FormState));
    setDirty(true);
  };

  const setFacility = (key: keyof Facilities, value: unknown) => {
    setForm(prev => ({ ...prev, facilities: { ...(prev.facilities ?? {}), [key]: value } } as FormState));
    setDirty(true);
  };

  const setContact = (key: keyof Contact, value: string) => {
    setForm(prev => ({ ...prev, contact: { ...(prev.contact ?? {}), [key]: value || null } } as FormState));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await masjidsApi.update(id, {
        name: form.name,
        address: form.address,
        admin_region: form.admin_region,
        timezone: form.timezone,
        description: form.description,
        facilities: form.facilities,
        contact: form.contact,
      });
      toast.success("Changes saved");
      setDirty(false);
      load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleVerify = async () => {
    setActionLoading(true);
    try { await masjidsApi.verify(id); toast.success("Masjid verified ✓"); load(); }
    catch { toast.error("Failed to verify"); }
    finally { setActionLoading(false); }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try { await masjidsApi.update(id, { status: "active" }); toast.success("Masjid activated"); load(); }
    catch { toast.error("Failed to activate"); }
    finally { setActionLoading(false); }
  };

  const handleSuspend = () => {
    setSuspendReason("");
    setSuspendDialogOpen(true);
  };

  const confirmSuspend = async () => {
    if (suspendReason.length < 10) { toast.error("Reason must be at least 10 characters"); return; }
    setSuspendLoading(true);
    try {
      await masjidsApi.suspend(id, suspendReason);
      toast.success("Masjid suspended");
      setSuspendDialogOpen(false);
      load();
    } catch { toast.error("Failed to suspend"); }
    finally { setSuspendLoading(false); }
  };

  const handleUnsuspend = async () => {
    setActionLoading(true);
    try { await masjidsApi.update(id, { status: "active" }); toast.success("Masjid unsuspended"); load(); }
    catch { toast.error("Failed to unsuspend"); }
    finally { setActionLoading(false); }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try { await masjidsApi.update(id, { status: "removed" }); toast.success("Masjid removed"); router.push("/admin/masjids"); }
    catch { toast.error("Failed to remove"); }
    finally { setRemoving(false); setRemoveOpen(false); }
  };

  const handleMerge = async () => {
    if (!mergeTargetId.trim()) { toast.error("Enter a target masjid ID"); return; }
    setMergeLoading(true);
    try {
      await masjidsApi.merge(id, mergeTargetId.trim());
      toast.success("Masjids merged successfully");
      router.push("/admin/masjids");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Merge failed");
    } finally {
      setMergeLoading(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-5">
        <div className="flex-1 flex flex-col gap-5"><Skeleton className="h-64" /><Skeleton className="h-96" /></div>
        <div className="w-full lg:w-72 flex flex-col gap-5"><Skeleton className="h-48" /><Skeleton className="h-40" /></div>
      </div>
    </div>
  );

  if (!masjid) return <div className="p-8 text-muted-foreground">Masjid not found</div>;

  const fac = (form.facilities ?? {}) as Partial<Facilities>;
  const con = (form.contact ?? {}) as Partial<Contact>;

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="w-40" />
        <h1 className="font-heading text-2xl font-bold text-foreground">{masjid.name}</h1>
        <Button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="bg-primary hover:bg-primary/90 gap-2 disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left column */}
        <div className="flex-1 flex flex-col gap-5">

          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-5">
            <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Basic Information</h2>

            <div className="flex flex-col gap-1.5">
              <Label>Masjid Name</Label>
              <Input value={form.name ?? ""} onChange={e => set("name", e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Full Address</Label>
              <Input value={form.address ?? ""} onChange={e => set("address", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Admin Region</Label>
                <Input value={form.admin_region ?? ""} onChange={e => set("admin_region", e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="masjid-timezone">Timezone</Label>
                <select
                  id="masjid-timezone"
                  value={form.timezone ?? "Asia/Dhaka"}
                  onChange={e => set("timezone", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
                  <option value="Asia/Karachi">Asia/Karachi (UTC+5)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Phone</Label>
                <Input value={con.phone ?? ""} onChange={e => setContact("phone", e.target.value)} placeholder="+880..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={con.email ?? ""} onChange={e => setContact("email", e.target.value)} placeholder="contact@masjid.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>WhatsApp</Label>
                <Input value={con.whatsapp ?? ""} onChange={e => setContact("whatsapp", e.target.value)} placeholder="+880..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Website</Label>
                <Input value={con.website_url ?? ""} onChange={e => setContact("website_url", e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Facilities</h2>

            <div className="flex flex-col gap-3">
              {FACILITY_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`fac-${key}`} className="text-sm font-normal cursor-pointer">{label}</Label>
                  <Switch
                    id={`fac-${key}`}
                    checked={!!(fac[key] as boolean)}
                    onCheckedChange={v => setFacility(key, v)}
                  />
                </div>
              ))}
            </div>

            {fac.has_parking && (
              <div className="flex flex-col gap-1.5 mt-2">
                <Label>Parking Capacity</Label>
                <Input
                  type="number"
                  value={fac.parking_capacity ?? ""}
                  onChange={e => setFacility("parking_capacity", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Number of spaces"
                  className="w-40"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <Label>Imam Name</Label>
                <Input value={fac.imam_name ?? ""} onChange={e => setFacility("imam_name", e.target.value || null)} placeholder="Sheikh..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Imam Qualifications</Label>
                <Input value={fac.imam_qualifications ?? ""} onChange={e => setFacility("imam_qualifications", e.target.value || null)} placeholder="e.g. Al-Azhar graduate" />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-5">

          {/* Status & Verification */}
          <div className="bg-primary rounded-xl p-5 flex flex-col gap-4">
            <h2 className="font-semibold text-white">Status</h2>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-full ${STATUS_STYLES[masjid.status] ?? STATUS_STYLES.pending}`}>
                {masjid.status.charAt(0).toUpperCase() + masjid.status.slice(1)}
              </span>
              {masjid.verified && (
                <div className="flex items-center gap-1.5 bg-accent rounded-full px-2.5 py-1">
                  <BadgeCheck className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-xs text-secondary font-medium">Verified</span>
                </div>
              )}
            </div>

            {masjid.suspension_reason && (
              <p className="text-xs text-white/60 bg-white/10 rounded-lg p-2.5">{masjid.suspension_reason}</p>
            )}

            <div className="flex flex-col gap-2">
              {masjid.status === "pending" && (
                <Button onClick={handleActivate} disabled={actionLoading} className="w-full bg-secondary text-primary hover:bg-secondary/90 font-semibold text-sm h-9 disabled:opacity-50">
                  {actionLoading ? "Activating…" : "Activate"}
                </Button>
              )}
              {masjid.status === "active" && !masjid.verified && (
                <Button onClick={handleVerify} disabled={actionLoading} className="w-full bg-secondary text-primary hover:bg-secondary/90 font-semibold text-sm h-9 disabled:opacity-50">
                  <BadgeCheck className="h-4 w-4 mr-1.5" /> {actionLoading ? "Verifying…" : "Verify Masjid"}
                </Button>
              )}
              {masjid.status === "active" && (
                <button onClick={handleSuspend} className="w-full h-9 rounded-lg border border-white/40 text-white text-sm hover:bg-white/10 transition-colors">
                  Suspend
                </button>
              )}
              {masjid.status === "suspended" && (
                <Button onClick={handleUnsuspend} disabled={actionLoading} className="w-full bg-secondary text-primary hover:bg-secondary/90 font-semibold text-sm h-9 disabled:opacity-50">
                  {actionLoading ? "Unsuspending…" : "Unsuspend"}
                </Button>
              )}
            </div>
          </div>

          {/* Prayer Times */}
          <div className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex flex-col gap-4">
            <h2 className="font-semibold text-foreground text-sm">Today&apos;s Prayer Times</h2>
            {prayerTimes ? (
              <div className="grid grid-cols-5 gap-1">
                {[
                  { name: "Fajr", time: prayerTimes.fajr_azan },
                  { name: "Dhuhr", time: prayerTimes.dhuhr_azan },
                  { name: "Asr", time: prayerTimes.asr_azan },
                  { name: "Maghrib", time: prayerTimes.maghrib_azan },
                  { name: "Isha", time: prayerTimes.isha_azan },
                ].map(p => (
                  <div key={p.name} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{p.name}</span>
                    <span className="text-xs font-bold text-foreground font-mono">{p.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No prayer times set</p>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border-2 border-[#FFEDED] p-5 flex flex-col gap-3">
            <h2 className="font-semibold text-[#C0392B] text-sm flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Removing this masjid sets its status to &quot;removed&quot;. Merging moves all data into another masjid and deletes this one.
            </p>
            <button
              onClick={() => setRemoveOpen(true)}
              className="w-full h-9 rounded-lg border border-[#C0392B] text-[#C0392B] text-sm hover:bg-[#FFEDED] transition-colors"
            >
              Remove Masjid
            </button>
            <button
              onClick={() => { setMergeTargetId(""); setMergeOpen(true); }}
              className="w-full h-9 rounded-lg border border-[#C0392B] text-[#C0392B] text-sm hover:bg-[#FFEDED] transition-colors"
            >
              Merge into Another…
            </button>
          </div>
        </div>
      </div>

      {/* Suspend dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={open => { if (!suspendLoading) setSuspendDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Masjid</DialogTitle>
            <DialogDescription>
              Provide a reason for the suspension. This will be visible to the masjid admin.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter reason for suspension (min 10 characters)"
            value={suspendReason}
            onChange={e => setSuspendReason(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{suspendReason.length}/500</p>
          <DialogFooter showCloseButton>
            <Button
              onClick={confirmSuspend}
              disabled={suspendReason.length < 10 || suspendLoading}
              className="bg-[#C0392B] hover:bg-[#a93226] text-white"
            >
              {suspendLoading ? "Suspending…" : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation dialog */}
      <AlertDialog open={removeOpen} onOpenChange={open => { if (!removing) setRemoveOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove &quot;{masjid.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This sets the masjid status to <strong>removed</strong>. It will no longer appear in search results or the public directory. This action can be reversed by an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-[#C0392B] hover:bg-[#a93226] text-white disabled:opacity-50"
            >
              {removing ? "Removing…" : "Remove Masjid"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Merge dialog */}
      <Dialog open={mergeOpen} onOpenChange={open => { if (!mergeLoading) setMergeOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Merge &quot;{masjid.name}&quot; into Another</DialogTitle>
            <DialogDescription>
              All data from this masjid (announcements, events, followers, etc.) will be moved to the target. This masjid will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Label>Target Masjid ID (UUID)</Label>
            <Input
              value={mergeTargetId}
              onChange={e => setMergeTargetId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter showCloseButton>
            <Button
              onClick={handleMerge}
              disabled={!mergeTargetId.trim() || mergeLoading}
              className="bg-[#C0392B] hover:bg-[#a93226] text-white"
            >
              {mergeLoading ? "Merging…" : "Merge & Delete This Masjid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
