"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Save } from "lucide-react";
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

type FormState = Partial<MasjidDetail> & { facilities?: Partial<Facilities>; contact?: Partial<Contact> };

export default function MasjidProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const masjidId = user?.masjidId;

  const [masjid, setMasjid] = useState<MasjidDetail | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!masjidId) { router.push("/login"); return; }
  }, [masjidId, router]);

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
      load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="p-8 flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-5">
        <div className="flex-1 flex flex-col gap-5"><Skeleton className="h-64" /><Skeleton className="h-80" /></div>
        <div className="w-72"><Skeleton className="h-32" /></div>
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
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">{masjid.name}</h1>
          {masjid.verified && (
            <div className="flex items-center gap-1 bg-accent/10 text-accent rounded-full px-2.5 py-1">
              <BadgeCheck className="h-4 w-4" />
              <span className="text-xs font-medium">Verified</span>
            </div>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="bg-primary hover:bg-primary/90 gap-2 disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* Single column layout (no admin actions on right) */}
      <div className="flex gap-5 items-start">
        <div className="flex-1 flex flex-col gap-5">

          {/* Basic Info */}
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
                <select value={form.timezone ?? "Asia/Dhaka"} onChange={e => set("timezone", e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none">
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
          </div>
        </div>
      </div>
    </div>
  );
}
