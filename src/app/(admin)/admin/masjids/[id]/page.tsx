"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  pending:   "bg-[#FFF3CD] text-[#856404]",
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
    try { await masjidsApi.verify(id); toast.success("Masjid verified ✓"); load(); }
    catch { toast.error("Failed to verify"); }
  };

  const handleActivate = async () => {
    try { await masjidsApi.update(id, { status: "active" }); toast.success("Masjid activated"); load(); }
    catch { toast.error("Failed to activate"); }
  };

  const handleSuspend = async () => {
    const reason = prompt("Reason for suspension (min 10 chars):");
    if (!reason || reason.length < 10) { toast.error("Reason too short"); return; }
    try { await masjidsApi.suspend(id, reason); toast.success("Masjid suspended"); load(); }
    catch { toast.error("Failed to suspend"); }
  };

  const handleUnsuspend = async () => {
    try { await masjidsApi.update(id, { status: "active" }); toast.success("Masjid unsuspended"); load(); }
    catch { toast.error("Failed to unsuspend"); }
  };

  const handleRemove = async () => {
    try { await masjidsApi.update(id, { status: "removed" }); toast.success("Masjid removed"); router.push("/admin/masjids"); }
    catch { toast.error("Failed to remove"); }
    finally { setRemoveOpen(false); }
  };

  if (loading) return (
    <div className="p-8 flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-5">
        <div className="flex-1 flex flex-col gap-5"><Skeleton className="h-64" /><Skeleton className="h-96" /></div>
        <div className="w-72 flex flex-col gap-5"><Skeleton className="h-48" /><Skeleton className="h-40" /></div>
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
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Masjids
        </button>
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
      <div className="flex gap-5 items-start">
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
                <Label>Timezone</Label>
                <select
                  value={form.timezone ?? "Asia/Dhaka"}
                  onChange={e => set("timezone", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none"
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
                  <span className="text-sm text-foreground">{label}</span>
                  <button
                    type="button"
                    onClick={() => setFacility(key, !(fac[key] as boolean))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${fac[key] ? "bg-accent" : "bg-border"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${fac[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
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
        <div className="w-72 shrink-0 flex flex-col gap-5">

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
                <Button onClick={handleActivate} className="w-full bg-secondary text-primary hover:bg-secondary/90 font-semibold text-sm h-9">
                  Activate
                </Button>
              )}
              {masjid.status === "active" && !masjid.verified && (
                <Button onClick={handleVerify} className="w-full bg-secondary text-primary hover:bg-secondary/90 font-semibold text-sm h-9">
                  <BadgeCheck className="h-4 w-4 mr-1.5" /> Verify Masjid
                </Button>
              )}
              {masjid.status === "active" && (
                <Button onClick={handleSuspend} variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 text-sm h-9">
                  Suspend
                </Button>
              )}
              {masjid.status === "suspended" && (
                <Button onClick={handleUnsuspend} className="w-full bg-secondary text-primary hover:bg-secondary/90 font-semibold text-sm h-9">
                  Unsuspend
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
              Removing this masjid sets its status to &quot;removed&quot;. It will no longer appear in search results.
            </p>
            <button
              onClick={() => setRemoveOpen(true)}
              className="w-full h-9 rounded-lg border border-[#C0392B] text-[#C0392B] text-sm hover:bg-[#FFEDED] transition-colors"
            >
              Remove Masjid
            </button>
          </div>
        </div>
      </div>

      {/* Remove confirmation dialog */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove &quot;{masjid.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This sets the masjid status to <strong>removed</strong>. It will no longer appear in search results or the public directory. This action can be reversed by an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-[#C0392B] hover:bg-[#a93226] text-white"
            >
              Remove Masjid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
