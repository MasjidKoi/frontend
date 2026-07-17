import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#111F17] py-5">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 lg:px-12 xl:px-16">
        <p className="text-sm text-white/70 text-center sm:text-left">
          © 2026 MasjidKoi · Team T40 — Insanity Check · University of Dhaka
        </p>
        <nav className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-7">
          {["Privacy", "Terms", "GitHub"].map((label) => (
            <Link
              key={label}
              href="#"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
