"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { masjidsApi } from "@/lib/api/masjids";

const TABS = [
  { label: "Profile",       path: "" },
  { label: "Prayer Times",  path: "/prayer-times" },
  { label: "Announcements", path: "/announcements" },
  { label: "Events",        path: "/events" },
  { label: "Campaigns",     path: "/campaigns" },
  { label: "Donations",     path: "/donations" },
  { label: "Reviews",       path: "/reviews" },
  { label: "Co-admins",     path: "/co-admins" },
  { label: "Photos",        path: "/photos" },
];

export default function MasjidSubLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    masjidsApi.byId(id)
      .then(m => setName(m.name ?? "Masjid"))
      .catch(() => setName("Masjid"));
  }, [id]);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="bg-card border-b border-border/30 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-0 flex flex-col gap-3 sm:gap-4 min-w-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/masjids")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Masjids
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground truncate max-w-xs">{name}</span>
        </div>

        {/* Tabs — scroll horizontally on narrow screens */}
        <div className="-mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 min-w-0">
          <div className="flex gap-0 overflow-x-auto pb-px [-webkit-overflow-scrolling:touch]">
            {TABS.map(({ label, path }) => {
              const href = `/admin/masjids/${id}${path}`;
              const active = path === ""
                ? pathname === `/admin/masjids/${id}`
                : pathname.startsWith(href);
              return (
                <Link
                  key={path}
                  href={href}
                  className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
