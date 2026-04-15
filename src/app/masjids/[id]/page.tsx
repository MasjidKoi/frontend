"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, BadgeCheck, Users, Car, Accessibility,
  Droplets, School, HeartHandshake, ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { masjidsApi } from "@/lib/api/masjids";
import { prayerTimesApi } from "@/lib/api/prayer-times";
import { announcementsApi } from "@/lib/api/announcements";

interface Masjid {
  masjid_id: string; name: string; address: string; admin_region: string;
  verified: boolean; status: string; timezone: string; description: string | null;
  facilities: {
    has_sisters_section: boolean; has_wudu_area: boolean; has_parking: boolean;
    has_wheelchair_access: boolean; has_school: boolean; has_janazah: boolean;
    imam_name: string | null;
  } | null;
  contact: { phone: string | null; email: string | null; website_url: string | null } | null;
}

interface PrayerTime {
  fajr_azan: string; dhuhr_azan: string; asr_azan: string; maghrib_azan: string; isha_azan: string;
  fajr_iqamah: string | null; dhuhr_iqamah: string | null; asr_iqamah: string | null;
  maghrib_iqamah: string | null; isha_iqamah: string | null;
  date: string;
}

interface Announcement {
  announcement_id: string; title: string; body: string;
  published_at: string | null; is_published: boolean;
}

const PRAYERS = [
  { key: "fajr", label: "Fajr" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
] as const;

const FACILITIES = [
  { key: "has_sisters_section", label: "Sisters Section", icon: Users },
  { key: "has_parking", label: "Parking", icon: Car },
  { key: "has_wheelchair_access", label: "Wheelchair Access", icon: Accessibility },
  { key: "has_wudu_area", label: "Wudu Area", icon: Droplets },
  { key: "has_school", label: "Islamic School", icon: School },
  { key: "has_janazah", label: "Janazah Facility", icon: HeartHandshake },
] as const;

export default function PublicMasjidPage() {
  const { id } = useParams<{ id: string }>();
  const [masjid, setMasjid] = useState<Masjid | null>(null);
  const [pt, setPt] = useState<PrayerTime | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, ptResp, annResp] = await Promise.all([
          masjidsApi.byId(id),
          prayerTimesApi.get(id, { days: 1 }).then(d => d.dates?.[0] ?? null).catch(() => null),
          announcementsApi.list(id, { page_size: 10 }).catch(() => ({ items: [] })),
        ]);
        setMasjid(m);
        setPt(ptResp);
        setAnnouncements(annResp.items ?? []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );

  if (!masjid) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Masjid not found</p>
    </div>
  );

  const fac = (masjid.facilities ?? {}) as Record<string, unknown>;
  const enabledFacilities = FACILITIES.filter(f => fac[f.key]);

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal nav */}
      <header className="bg-primary">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center text-base font-bold">م</div>
            <span className="font-heading font-bold">MasjidKoi</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-secondary/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Masjid header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-3xl font-bold text-foreground">{masjid.name}</h1>
            {masjid.verified && (
              <div className="flex items-center gap-1 bg-accent/10 text-accent rounded-full px-2.5 py-1">
                <BadgeCheck className="h-4 w-4" />
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="text-sm">{masjid.address} · {masjid.admin_region}</span>
          </div>
          {masjid.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{masjid.description}</p>
          )}
          {/* Facilities */}
          {enabledFacilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {enabledFacilities.map(({ key, label, icon: Icon }) => (
                <span key={key} className="flex items-center gap-1.5 text-xs bg-secondary text-primary rounded-full px-3 py-1.5 font-medium">
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Prayer times */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/30 overflow-hidden">
          <div className="bg-primary px-5 py-4">
            <p className="font-heading font-bold text-white text-base">Prayer Times</p>
            {pt && <p className="text-xs text-secondary/70 mt-0.5">
              {new Date(pt.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>}
          </div>
          {pt ? (
            <div className="grid grid-cols-5">
              {PRAYERS.map(({ key, label }, i) => {
                const azan = pt[`${key}_azan` as keyof PrayerTime] as string;
                const iqamah = pt[`${key}_iqamah` as keyof PrayerTime] as string | null;
                return (
                  <div key={key} className={`px-4 py-5 flex flex-col items-center gap-2 ${i < 4 ? "border-r border-border/20" : ""}`}>
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className="font-heading font-bold text-lg text-foreground font-mono">{azan}</p>
                    {iqamah && (
                      <p className="text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-0.5">{iqamah}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">Prayer times not available</p>
          )}
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-bold text-foreground">Announcements</h2>
            {announcements.map(ann => (
              <div key={ann.announcement_id} className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex flex-col gap-2">
                <h3 className="font-semibold text-foreground">{ann.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ann.body}</p>
                {ann.published_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(ann.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact */}
        {(masjid.contact?.phone || masjid.contact?.email || masjid.contact?.website_url) && (
          <div className="bg-white rounded-xl shadow-sm border border-border/30 p-5 flex flex-col gap-3">
            <h2 className="font-semibold text-foreground">Contact</h2>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {masjid.contact?.phone && <span>📞 {masjid.contact.phone}</span>}
              {masjid.contact?.email && <span>✉️ {masjid.contact.email}</span>}
              {masjid.contact?.website_url && (
                <a href={masjid.contact.website_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  🌐 {masjid.contact.website_url}
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
