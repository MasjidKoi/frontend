"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/api/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/masjids", label: "Masjids", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit-log", label: "Audit Log", icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col bg-primary text-primary-foreground">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-lg font-bold">م</div>
          <span className="font-heading font-bold text-base">MasjidKoi</span>
        </div>

        <div className="h-px bg-white/10 mx-0" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 h-10 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-accent text-white font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/10",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="h-px bg-white/10" />

        {/* User */}
        <div className="flex items-center gap-2.5 px-4 h-[60px] shrink-0">
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Super Admin</p>
            <p className="text-[11px] text-white/50 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors shrink-0">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
