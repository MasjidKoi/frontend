import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

/* Body font — Inter */
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

/* Heading font — Geist (same family, sharper for display) */
const geistSans = Geist({ subsets: ["latin"], variable: "--font-heading" });

/* Monospace — for prayer times, IDs, etc. */
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "MasjidKoi — Connect with Your Nearest Masjid",
  description:
    "Find nearby masjids, check prayer times, and stay connected with your community across Bangladesh.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        inter.variable,
        geistSans.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
