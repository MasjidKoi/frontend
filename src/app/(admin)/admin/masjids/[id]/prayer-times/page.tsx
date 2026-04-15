"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, Save, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { prayerTimesApi } from "@/lib/api/prayer-times";
import { toast } from "sonner";

interface PrayerEntry {
  fajr_azan: string;
  dhuhr_azan: string;
  asr_azan: string;
  maghrib_azan: string;
  isha_azan: string;
  fajr_iqamah: string | null;
  dhuhr_iqamah: string | null;
  asr_iqamah: string | null;
  maghrib_iqamah: string | null;
  isha_iqamah: string | null;
  calculation_method: string;
  madhab: string;
  date: string;
}

interface JumahData {
  khutbah_1_azan: string | null;
  khutbah_1_start: string | null;
  khutbah_2_azan: string | null;
  khutbah_2_start: string | null;
  notes: string | null;
}

const PRAYERS = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
] as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function PrayerTimesPage() {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<PrayerEntry | null>(null);
  const [jumah, setJumah] = useState<JumahData | null>(null);
  const [azan, setAzan] = useState<Record<string, string>>({});
  const [iqamah, setIqamah] = useState<Record<string, string>>({});
  const [jumahForm, setJumahForm] = useState<Record<string, string>>({});
  const [editingIqamah, setEditingIqamah] = useState<string | null>(null);
  const [editingAzan, setEditingAzan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ptResp, jumahResp] = await Promise.all([
        prayerTimesApi.get(id, { date: today }),
        prayerTimesApi.getJumah(id).catch(() => null),
      ]);
      const pt = ptResp.dates?.[0] ?? null;
      setEntry(pt);
      if (pt) {
        setAzan({
          fajr: pt.fajr_azan ?? "",
          dhuhr: pt.dhuhr_azan ?? "",
          asr: pt.asr_azan ?? "",
          maghrib: pt.maghrib_azan ?? "",
          isha: pt.isha_azan ?? "",
        });
        setIqamah({
          fajr: pt.fajr_iqamah ?? "",
          dhuhr: pt.dhuhr_iqamah ?? "",
          asr: pt.asr_iqamah ?? "",
          maghrib: pt.maghrib_iqamah ?? "",
          isha: pt.isha_iqamah ?? "",
        });
      }
      if (jumahResp) {
        setJumah(jumahResp);
        setJumahForm({
          khutbah_1_azan: jumahResp.khutbah_1_azan ?? "",
          khutbah_1_start: jumahResp.khutbah_1_start ?? "",
          khutbah_2_azan: jumahResp.khutbah_2_azan ?? "",
          khutbah_2_start: jumahResp.khutbah_2_start ?? "",
          notes: jumahResp.notes ?? "",
        });
      }
    } catch {
      toast.error("Failed to load prayer times");
    } finally {
      setLoading(false);
    }
  }, [id, today]);

  useEffect(() => { load(); }, [load]);

  const handleRecalc = async () => {
    setRecalculating(true);
    try {
      await prayerTimesApi.recalc(id, { date: today });
      await load();
      setDirty(false);
      toast.success("Prayer times recalculated");
    } catch {
      toast.error("Recalculation failed");
    } finally {
      setRecalculating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = { date: today };
      PRAYERS.forEach(p => {
        const azanVal = azan[p.key];
        if (azanVal && TIME_PATTERN.test(azanVal)) {
          payload[`${p.key}_azan`] = azanVal;
        }
        const iqamahVal = iqamah[p.key];
        if (iqamahVal && TIME_PATTERN.test(iqamahVal)) {
          payload[`${p.key}_iqamah`] = iqamahVal;
        }
      });
      await prayerTimesApi.update(id, payload);

      const jumahPayload: Record<string, string | null> = {};
      Object.entries(jumahForm).forEach(([k, v]) => {
        jumahPayload[k] = v || null;
      });
      await prayerTimesApi.updateJumah(id, jumahPayload);

      toast.success("Prayer times saved");
      setDirty(false);
      load();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  if (loading) return (
    <div className="p-8 flex flex-col gap-5">
      <Skeleton className="h-8 w-80" />
      <div className="grid grid-cols-5 gap-4">
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-44" />)}
      </div>
    </div>
  );

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Prayer Times</h1>
          {entry && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDate(entry.date)} · {entry.calculation_method} method · {entry.madhab} madhab
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRecalc}
            disabled={recalculating}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
            Recalculate
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="bg-primary hover:bg-primary/90 gap-2 disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* 5 prayer cards */}
      {entry ? (
        <div className="grid grid-cols-5 gap-4">
          {PRAYERS.map(({ key, label }, i) => {
            const isFirst = i === 0;
            const isEditingAzan = editingAzan === key;
            const isEditingIqamah = editingIqamah === key;

            const inputCls = `h-8 text-sm font-mono w-24 ${isFirst ? "bg-white/10 border-white/20 text-white placeholder:text-white/40" : ""}`;
            const displayCls = `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-mono transition-colors ${isFirst ? "bg-white/10 text-white hover:bg-white/20 w-full justify-between" : "bg-muted hover:bg-muted/70 text-foreground w-full justify-between border border-border/30"}`;

            return (
              <div
                key={key}
                className={`rounded-2xl p-5 flex flex-col gap-4 ${
                  isFirst ? "bg-primary text-white" : "bg-white shadow-sm border border-border/30"
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wide ${isFirst ? "text-secondary/70" : "text-muted-foreground"}`}>
                  {label}
                </p>

                {/* AZAN — editable */}
                <div>
                  <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isFirst ? "text-secondary/50" : "text-muted-foreground"}`}>Azan</p>
                  {isEditingAzan ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={azan[key] ?? ""}
                        onChange={e => { setAzan(p => ({ ...p, [key]: e.target.value })); setDirty(true); }}
                        placeholder="HH:MM"
                        className={inputCls}
                        autoFocus
                        onBlur={() => setEditingAzan(null)}
                        onKeyDown={e => { if (e.key === "Enter") setEditingAzan(null); }}
                      />
                      <button onClick={() => setEditingAzan(null)} className={`shrink-0 ${isFirst ? "text-secondary/70" : "text-accent"}`}>
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingAzan(key)} className={displayCls}>
                      <span className={`font-bold text-2xl ${isFirst ? "text-white" : "text-foreground"}`}>
                        {azan[key] || "—"}
                      </span>
                      <Pencil className="h-3 w-3 opacity-60 shrink-0" />
                    </button>
                  )}
                </div>

                {/* IQAMAH — editable */}
                <div>
                  <p className={`text-[10px] uppercase tracking-widest mb-1.5 ${isFirst ? "text-secondary/50" : "text-muted-foreground"}`}>Iqamah</p>
                  {isEditingIqamah ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={iqamah[key] ?? ""}
                        onChange={e => { setIqamah(p => ({ ...p, [key]: e.target.value })); setDirty(true); }}
                        placeholder="HH:MM"
                        className={inputCls}
                        autoFocus
                        onBlur={() => setEditingIqamah(null)}
                        onKeyDown={e => { if (e.key === "Enter") setEditingIqamah(null); }}
                      />
                      <button onClick={() => setEditingIqamah(null)} className={`shrink-0 ${isFirst ? "text-secondary/70" : "text-accent"}`}>
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingIqamah(key)} className={displayCls}>
                      <span>{iqamah[key] || "—"}</span>
                      <Pencil className="h-3 w-3 opacity-60 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border/30 p-8 text-center">
          <p className="text-muted-foreground text-sm">No prayer times for today. Click Recalculate to generate.</p>
        </div>
      )}

      {/* Jumu'ah Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-border/30 p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-foreground border-b border-border/30 pb-3">Jumu&apos;ah Schedule</h2>
        <div className="grid grid-cols-2 gap-5">
          {[
            { key: "khutbah_1_azan", label: "1st Khutbah Azan" },
            { key: "khutbah_1_start", label: "1st Khutbah Start" },
            { key: "khutbah_2_azan", label: "2nd Khutbah Azan" },
            { key: "khutbah_2_start", label: "2nd Khutbah Start" },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label className="text-sm">{label}</Label>
              <Input
                value={jumahForm[key] ?? ""}
                onChange={e => { setJumahForm(p => ({ ...p, [key]: e.target.value })); setDirty(true); }}
                placeholder="HH:MM"
                className="font-mono w-32"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Notes</Label>
          <Input
            value={jumahForm.notes ?? ""}
            onChange={e => { setJumahForm(p => ({ ...p, notes: e.target.value })); setDirty(true); }}
            placeholder="e.g. Two sessions due to capacity"
          />
        </div>
      </div>
    </div>
  );
}
