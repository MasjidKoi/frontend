"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  Sun,
  Megaphone,
  LogOut,
  CalendarDays,
  Landmark,
  HandCoins,
  Star,
  Users,
  Images,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { masjidsApi } from "@/lib/api/masjids";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  { href: "/masjid/profile", label: "My Masjid", icon: Building2 },
  { href: "/masjid/prayer-times", label: "Prayer Times", icon: Sun },
  { href: "/masjid/announcements", label: "Announcements", icon: Megaphone },
  { href: "/masjid/events", label: "Events", icon: CalendarDays },
  { href: "/masjid/campaigns", label: "Campaigns", icon: Landmark },
  { href: "/masjid/donations", label: "Donations", icon: HandCoins },
  { href: "/masjid/reviews", label: "Reviews", icon: Star },
  { href: "/masjid/co-admins", label: "Co-admins", icon: Users },
  { href: "/masjid/photos", label: "Photos", icon: Images },
];

function MasjidNavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 px-3 h-10 rounded-lg text-sm transition-colors",
              active
                ? "bg-accent text-accent-foreground font-medium"
                : "text-white/60 hover:text-white hover:bg-white/10",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function MasjidSidebarFooter({
  userEmail,
  onLogout,
}: {
  userEmail: string | undefined;
  onLogout: () => void;
}) {
  return (
    <>
      <div className="h-px bg-white/10" />
      <div className="flex items-center gap-2.5 px-4 h-[60px] shrink-0">
        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground shrink-0">
          {userEmail?.[0]?.toUpperCase() ?? "A"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">Masjid Admin</p>
          <p className="text-[11px] text-white/70 truncate">{userEmail}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="text-white/70 hover:text-white transition-colors shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

export default function MasjidLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [masjidName, setMasjidName] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user?.masjidId) {
      masjidsApi
        .byId(user.masjidId)
        .then((m) => setMasjidName(m.name ?? "My Masjid"))
        .catch(() => setMasjidName("My Masjid"));
    }
  }, [user?.masjidId]);

  const handleLogout = async () => {
    setMobileOpen(false);
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    clearAuth();
    router.push("/login");
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex h-dvh min-h-0 bg-background overflow-hidden">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-primary text-primary-foreground">
        <div className="flex items-center gap-2.5 px-5 h-14 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center text-lg font-bold">
            م
          </div>
          <span className="font-heading font-bold text-base">MasjidKoi</span>
        </div>
        <div className="h-px bg-white/10" />
        {masjidName && (
          <div className="px-5 py-3 shrink-0">
            <p className="text-xs text-white/70 uppercase tracking-wide mb-0.5">Managing</p>
            <p className="text-sm font-semibold text-white truncate">{masjidName}</p>
          </div>
        )}
        <div className="h-px bg-white/10 mx-0" />
        <MasjidNavLinks pathname={pathname} className="flex-1 px-3 py-4 overflow-y-auto" />
        <MasjidSidebarFooter userEmail={user?.email} onLogout={handleLogout} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw,16rem)] p-0 gap-0 bg-primary text-primary-foreground border-white/10 [&_button[data-slot=sheet-close]]:text-white/70 [&_button[data-slot=sheet-close]]:hover:text-white"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Masjid admin navigation</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center gap-2.5 px-5 h-14 shrink-0 border-b border-white/10">
              <div className="h-8 w-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center text-lg font-bold">
                م
              </div>
              <span className="font-heading font-bold text-base">MasjidKoi</span>
            </div>
            {masjidName && (
              <div className="px-5 py-3 shrink-0 border-b border-white/10">
                <p className="text-xs text-white/70 uppercase tracking-wide mb-0.5">Managing</p>
                <p className="text-sm font-semibold text-white truncate">{masjidName}</p>
              </div>
            )}
            <MasjidNavLinks pathname={pathname} onNavigate={closeMobile} className="flex-1 px-3 py-4 overflow-y-auto" />
            <MasjidSidebarFooter userEmail={user?.email} onLogout={handleLogout} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <header className="lg:hidden flex items-center gap-2 h-14 shrink-0 px-3 border-b border-border/30 bg-background">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Open navigation menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-heading font-semibold text-sm truncate min-w-0">
            {masjidName || "Masjid admin"}
          </span>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
