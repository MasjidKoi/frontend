"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, BadgeCheck, ArrowLeft, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { masjidsApi } from "@/lib/api/masjids";

interface Masjid {
  masjid_id: string;
  name: string;
  address: string;
  admin_region: string;
  verified: boolean;
  status: string;
}

function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function MasjidsListPage() {
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const debouncedQ = useDebounce(q);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await masjidsApi.list({
        q: debouncedQ || undefined,
        status: "active",
        page_size: 50,
      });
      setMasjids(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-primary shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center text-base font-bold">
              م
            </div>
            <span className="font-heading font-bold">MasjidKoi</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-secondary/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Page header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Find a Masjid
          </h1>
          <p className="text-muted-foreground">
            Browse all verified masjids across Bangladesh — prayer times, facilities, and announcements.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, area or district…"
            className="pl-10 h-11 text-base bg-white shadow-sm"
            autoFocus
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : masjids.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-base">
              {q ? `No masjids found for "${q}"` : "No masjids available yet."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground -mt-4">
              {total} masjid{total !== 1 ? "s" : ""}{q ? ` matching "${q}"` : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {masjids.map(m => (
                <Link
                  key={m.masjid_id}
                  href={`/masjids/${m.masjid_id}`}
                  className="group bg-white rounded-2xl shadow-sm border border-border/30 p-5 flex flex-col gap-3 hover:shadow-md hover:border-accent/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-heading font-bold text-foreground text-base group-hover:text-primary transition-colors truncate">
                        {m.name}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs truncate">
                          {m.address} · {m.admin_region}
                        </span>
                      </div>
                    </div>
                    {m.verified && (
                      <div className="flex items-center gap-1 bg-accent/10 text-accent rounded-full px-2 py-0.5 shrink-0">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">Verified</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-accent font-medium">
                    <Timer className="h-3.5 w-3.5" />
                    View prayer times & announcements →
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
