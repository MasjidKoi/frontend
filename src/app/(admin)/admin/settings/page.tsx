"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, type PlatformSettings } from "@/lib/api/admin";
import { toast } from "sonner";

type FormState = Omit<PlatformSettings, "settings_id" | "updated_at" | "updated_by_email"> & {
  supported_countries_raw: string;
};

function toForm(s: PlatformSettings): FormState {
  return {
    default_madhab: s.default_madhab,
    default_calc_method: s.default_calc_method,
    supported_countries: s.supported_countries,
    supported_countries_raw: (s.supported_countries ?? []).join(", "),
    reviews_enabled: s.reviews_enabled,
    checkins_enabled: s.checkins_enabled,
    platform_name: s.platform_name,
    maintenance_mode: s.maintenance_mode,
    maintenance_message: s.maintenance_message,
    terms_of_service: s.terms_of_service,
    privacy_policy: s.privacy_policy,
    terms_version: s.terms_version,
  };
}

function parseCountries(raw: string): string[] {
  return raw.split(",").map(c => c.trim().toUpperCase()).filter(c => c.length === 2);
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    adminApi.getSettings()
      .then(s => { setSettings(s); setForm(toForm(s)); })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const countries = parseCountries(form.supported_countries_raw);
      const updated = await adminApi.updateSettings({
        platform_name: form.platform_name,
        default_madhab: form.default_madhab,
        default_calc_method: form.default_calc_method,
        supported_countries: countries.length > 0 ? countries : null,
        reviews_enabled: form.reviews_enabled,
        checkins_enabled: form.checkins_enabled,
        maintenance_mode: form.maintenance_mode,
        maintenance_message: form.maintenance_mode ? (form.maintenance_message || null) : null,
        terms_of_service: form.terms_of_service || null,
        privacy_policy: form.privacy_policy || null,
        terms_version: form.terms_version || null,
      });
      setSettings(updated);
      setForm(toForm(updated));
      setDirty(false);
      toast.success("Settings saved");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );

  if (!form) return <div className="p-8 text-muted-foreground">Failed to load settings</div>;

  const countries = parseCountries(form.supported_countries_raw);

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure platform-wide defaults and feature flags</p>
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

      {/* Platform Branding */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Platform Branding</h2>
        <div className="flex flex-col gap-1.5 max-w-sm">
          <Label>Platform Name</Label>
          <Input
            value={form.platform_name}
            onChange={e => set("platform_name", e.target.value)}
            maxLength={100}
            placeholder="MasjidKoi"
          />
        </div>
      </div>

      {/* Prayer Defaults */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Prayer Defaults for New Masjids</h2>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <div className="flex flex-col gap-1.5">
            <Label>Default Madhab</Label>
            <select
              value={form.default_madhab}
              onChange={e => set("default_madhab", e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="hanafi">Hanafi</option>
              <option value="shafi">Shafi</option>
              <option value="maliki">Maliki</option>
              <option value="hanbali">Hanbali</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Default Calc Method</Label>
            <select
              value={form.default_calc_method}
              onChange={e => set("default_calc_method", e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="KARACHI">Karachi (University of Islamic Sciences)</option>
              <option value="ISNA">ISNA (North America)</option>
              <option value="MUSLIM_WORLD_LEAGUE">Muslim World League</option>
              <option value="EGYPT">Egypt (Ministry of Awqaf)</option>
              <option value="MAKKAH">Umm al-Qura (Makkah)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Supported Countries */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Supported Countries</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <div className="flex flex-col gap-1.5">
            <Label>ISO 3166-1 alpha-2 codes (comma-separated)</Label>
            <Input
              value={form.supported_countries_raw}
              onChange={e => set("supported_countries_raw", e.target.value)}
              placeholder="BD, MY, GB, US"
            />
            <p className="text-xs text-muted-foreground">2-letter codes only — invalid entries are ignored on save</p>
          </div>
          {countries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {countries.map(c => (
                <span key={c} className="text-xs font-medium bg-secondary text-primary px-2.5 py-1 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Feature Flags</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <Label className="text-sm font-medium cursor-pointer" htmlFor="reviews-toggle">Reviews Enabled</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Allow users to submit star ratings and reviews</p>
            </div>
            <Switch
              id="reviews-toggle"
              checked={form.reviews_enabled}
              onCheckedChange={v => set("reviews_enabled", v)}
            />
          </div>
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <Label className="text-sm font-medium cursor-pointer" htmlFor="checkins-toggle">Check-ins Enabled</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Allow GPS-based masjid check-ins and streaks</p>
            </div>
            <Switch
              id="checkins-toggle"
              checked={form.checkins_enabled}
              onCheckedChange={v => set("checkins_enabled", v)}
            />
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Maintenance Mode</h2>
        <div className="flex items-center justify-between max-w-sm">
          <div>
            <Label className="text-sm font-medium cursor-pointer" htmlFor="maintenance-toggle">Enable Maintenance Mode</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Show maintenance message to all users</p>
          </div>
          <Switch
            id="maintenance-toggle"
            checked={form.maintenance_mode}
            onCheckedChange={v => set("maintenance_mode", v)}
          />
        </div>
        {form.maintenance_mode && (
          <div className="flex flex-col gap-1.5 max-w-lg">
            <Label>Maintenance Message</Label>
            <Textarea
              value={form.maintenance_message ?? ""}
              onChange={e => set("maintenance_message", e.target.value || null)}
              placeholder="We're performing scheduled maintenance. Back shortly…"
              rows={3}
            />
          </div>
        )}
      </div>

      {/* Terms & Privacy */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Terms &amp; Privacy</h2>
        <div className="flex flex-col gap-1.5 max-w-xs">
          <Label>Terms Version</Label>
          <Input
            value={form.terms_version ?? ""}
            onChange={e => set("terms_version", e.target.value || null)}
            placeholder="1.0"
            className="w-32"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Terms of Service</Label>
          <Textarea
            value={form.terms_of_service ?? ""}
            onChange={e => set("terms_of_service", e.target.value || null)}
            placeholder="Enter terms of service…"
            rows={6}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Privacy Policy</Label>
          <Textarea
            value={form.privacy_policy ?? ""}
            onChange={e => set("privacy_policy", e.target.value || null)}
            placeholder="Enter privacy policy…"
            rows={6}
          />
        </div>
      </div>

      {/* Metadata footer */}
      {settings && (
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(settings.updated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          {settings.updated_by_email && ` by ${settings.updated_by_email}`}
        </p>
      )}
    </div>
  );
}
