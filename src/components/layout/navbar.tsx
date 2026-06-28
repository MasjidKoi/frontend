"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "/masjids", label: "Find a Masjid" },
  { href: "#for-masjids", label: "For Masjids" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-12 xl:px-16">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white text-lg font-bold">
            م
          </div>
          <span className="font-heading text-lg font-bold tracking-tight truncate">
            MasjidKoi
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-secondary hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-secondary hover:text-white hover:bg-accent"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-secondary text-primary hover:bg-secondary/90 font-semibold"
            >
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
          <div className="flex sm:hidden items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-secondary hover:text-white hover:bg-accent px-2"
            >
              <Link href="/login">Log in</Link>
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden text-secondary hover:text-white hover:bg-accent shrink-0"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw,20rem)] bg-primary text-primary-foreground border-white/10 [&_button[data-slot=sheet-close]]:text-secondary">
              <SheetHeader className="text-left border-b border-white/10 pb-4">
                <SheetTitle className="text-white font-heading">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 pt-4">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base text-secondary hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-semibold text-white bg-accent/80 hover:bg-accent mt-2 text-center"
                >
                  Get Started
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
