import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#111F17] py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-16">
        <p className="text-sm text-muted-foreground/60">
          © 2026 MasjidKoi · Team T40 — Insanity Check · University of Dhaka
        </p>
        <nav className="flex items-center gap-7">
          {["Privacy", "Terms", "GitHub"].map((label) => (
            <Link
              key={label}
              href="#"
              className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
