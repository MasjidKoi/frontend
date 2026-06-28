import type { Metadata, Viewport } from "next";
import { Geist_Mono, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/providers/auth-provider";
import { HashRedirect } from "@/components/auth/hash-redirect";
import { Toaster } from "@/components/ui/sonner";

// MasjidKoi design font — Hind Siliguri (বাংলা + English).
const hindSiliguri = Hind_Siliguri({
  subsets: ["latin", "bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "MasjidKoi — Connect with Your Nearest Masjid",
  description:
    "Find nearby masjids, check prayer times, and stay connected with your community across Bangladesh.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        hindSiliguri.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <HashRedirect />
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
