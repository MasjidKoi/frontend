"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Save, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { masjidsApi } from "@/lib/api/masjids";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

interface Facilities {
  has_sisters_section: boolean; has_wudu_area: boolean; has_wudu_male: boolean;
  has_wudu_female: boolean; has_wheelchair_access: boolean; has_parking: boolean;
  parking_capacity: number | null; has_janazah: boolean; has_school: boolean;
  imam_name: string | null; imam_qualifications: string | null;
  imam_languages: string | null; capacity_male: number | null; capacity_female: number | null;
}
interface Contact {
  phone: string | null; email: string | null; whatsapp: string | null; website_url: string | null;
}
interface MasjidDetail {
  masjid_id: string; name: string; address: string; admin_region: string; timezone: string;
  status: string; verified: boolean; description: string | null;
  facilities: Facilities | null; contact: Contact | null;
}

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

interface FormState {
  name?: string;
  address?: string;
  admin_region?: string;
  timezone?: string;
  description?: string | null;
  facilities?: Partial<Facilities>;
  contact?: Partial<Contact>;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || <span className="text-muted-foreground/50">—</span>}</p>
    </div>
  );
}

export default function MasjidProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const masjidId = user?.masjidId;

  const [masjid, setMasjid] = useState<MasjidDetail | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!authLoading && !masjidId) router.push("/login");
  }, [authLoading, masjidId, router]);

  const load = useCallback(async () => {
    if (!masjidId) return;
    setLoading(true);
    try {
      const m = await masjidsApi.byId(masjidId);
      setMasjid(m);
      setForm({
        name: m.name, address: m.address, admin_region: m.admin_region,
        timezone: m.timezone, description: m.description,
        facilities: { ...m.facilities }, contact: { ...m.contact },
      });
    } catch { toast.error("Failed to load masjid"); }
    finally { setLoading(false); }
  }, [masjidId]);

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

  const handleCancel = () => {
    if (!masjid) return;
    setForm({
      name: masjid.name, address: masjid.address, admin_region: masjid.admin_region,
      timezone: masjid.timezone, description: masjid.description,
      facilities: { ...(masjid.facilities ?? {}) } as Partial<Facilities>,
      contact: { ...(masjid.contact ?? {}) } as Partial<Contact>,
    });
    setDirty(false);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!masjidId) return;
    setSaving(true);
    try {
      await masjidsApi.update(masjidId, {
        name: form.name, address: form.address, admin_region: form.admin_region,
        timezone: form.timezone, description: form.description,
        facilities: form.facilities, contact: form.contact,
      });
      toast.success("Changes saved");
      setDirty(false);
      setEditing(false);
      load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (authLoading || loading) return (
    <div className="p-8 flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-56" />
      <Skeleton className="h-72" />
    </div>
  );

  if (!masjid) return <div className="p-8 text-muted-foreground">Masjid not found</div>;

  const fac = (form.facilities ?? {}) as Partial<Facilities>;
  const con = (form.contact ?? {}) as Partial<Contact>;
  const mFac = (masjid.facilities ?? {}) as Partial<Facilities>;
  const mCon = (masjid.contact ?? {}) as Partial<Contact>;

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">{masjid.name}</h1>
          {masjid.verified && (
            <div className="flex items-center gap-1 bg-accent/10 text-accent rounded-full px-2.5 py-1">
              <BadgeCheck className="h-4 w-4" />
              <span className="text-xs font-medium">Verified</span>
            </div>
          )}
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="bg-primary hover:bg-primary/90 gap-2 disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)} className="gap-2">
            <Pencil className="h-4 w-4" /> Edit Profile
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {editing ? (
          /* ── EDIT MODE ── */
          <>
            {/* Basic Info — edit */}
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
                  <Label htmlFor="profile-timezone">Timezone</Label>
                  <select id="profile-timezone" value={form.timezone ?? "Asia/Dhaka"} onChange={e => set("timezone", e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
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

            {/* Facilities — edit */}
            <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Facilities</h2>
              <div className="flex flex-col gap-3">
                {FACILITY_LABELS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={`fac-${key}`} className="text-sm font-normal cursor-pointer">{label}</Label>
                    <Switch id={`fac-${key}`} checked={!!(fac[key] as boolean)} onCheckedChange={v => setFacility(key, v)} />
                  </div>
                ))}
              </div>
              {fac.has_parking && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <Label>Parking Capacity</Label>
                  <Input type="number" value={fac.parking_capacity ?? ""} onChange={e => setFacility("parking_capacity", e.target.value ? parseInt(e.target.value) : null)} placeholder="Number of spaces" className="w-40" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div className="flex flex-col gap-1.5">
                  <Label>Imam Name</Label>
                  <Input value={fac.imam_name ?? ""} onChange={e => setFacility("imam_name", e.target.value || null)} placeholder="Sheikh..." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Imam Qualifications</Label>
                  <Input value={fac.imam_qualifications ?? ""} onChange={e => setFacility("imam_qualifications", e.target.value || null)} placeholder="e.g. Al-Azhar graduate" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-1">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <Label>Imam Languages</Label>
                  <Input value={fac.imam_languages ?? ""} onChange={e => setFacility("imam_languages", e.target.value || null)} placeholder="Arabic, English, Bengali" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Capacity (Male)</Label>
                  <Input type="number" value={fac.capacity_male ?? ""} onChange={e => setFacility("capacity_male", e.target.value ? parseInt(e.target.value) : null)} placeholder="0" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 max-w-[calc(33%_-_0.25rem)] mt-0">
                <Label>Capacity (Female)</Label>
                <Input type="number" value={fac.capacity_female ?? ""} onChange={e => setFacility("capacity_female", e.target.value ? parseInt(e.target.value) : null)} placeholder="0" />
              </div>
            </div>
          </>
        ) : (
          /* ── VIEW MODE ── */
          <>
            {/* Basic Info — view */}
            <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-5">
              <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Basic Information</h2>

              <Field label="Masjid Name" value={masjid.name} />
              <Field label="Full Address" value={masjid.address} />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Admin Region" value={masjid.admin_region} />
                <Field label="Timezone" value={masjid.timezone} />
              </div>

              {(mCon.phone || mCon.email || mCon.whatsapp || mCon.website_url) && (
                <>
                  <div className="border-t border-border/20 pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contact</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Phone" value={mCon.phone} />
                      <Field label="Email" value={mCon.email} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="WhatsApp" value={mCon.whatsapp} />
                    <Field label="Website" value={mCon.website_url} />
                  </div>
                </>
              )}
            </div>

            {/* Facilities — view */}
            <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Facilities</h2>

              <div className="flex flex-wrap gap-2">
                {FACILITY_LABELS.map(({ key, label }) => {
                  const active = !!(mFac[key] as boolean);
                  return (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                        active
                          ? "bg-[#D4EDDA] text-[#155724] border-[#c3e6cb]"
                          : "bg-muted/40 text-muted-foreground border-border/30"
                      }`}
                    >
                      <span>{active ? "✓" : "✗"}</span>
                      {label}
                    </span>
                  );
                })}
              </div>

              {(mFac.imam_name || mFac.imam_qualifications || mFac.imam_languages || mFac.capacity_male || mFac.capacity_female || (mFac.has_parking && mFac.parking_capacity)) && (
                <div className="border-t border-border/20 pt-4 grid grid-cols-2 gap-4">
                  {mFac.imam_name && <Field label="Imam" value={mFac.imam_name} />}
                  {mFac.imam_qualifications && <Field label="Qualifications" value={mFac.imam_qualifications} />}
                  {mFac.imam_languages && <Field label="Languages" value={mFac.imam_languages} />}
                  {mFac.has_parking && mFac.parking_capacity && (
                    <Field label="Parking Capacity" value={`${mFac.parking_capacity} spaces`} />
                  )}
                  {mFac.capacity_male != null && <Field label="Capacity (Male)" value={`${mFac.capacity_male}`} />}
                  {mFac.capacity_female != null && <Field label="Capacity (Female)" value={`${mFac.capacity_female}`} />}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
