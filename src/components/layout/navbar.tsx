import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-lg font-bold">
            م
          </div>
          <span className="font-heading text-lg font-bold tracking-tight">
            MasjidKoi
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm text-secondary hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-secondary hover:text-white transition-colors"
          >
            How it works
          </Link>
          <Link
            href="#for-masjids"
            className="text-sm text-secondary hover:text-white transition-colors"
          >
            For Masjids
          </Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
