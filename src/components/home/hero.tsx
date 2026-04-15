"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BadgeCheck } from "lucide-react";
import { HeroEntrance, HeroCardEntrance } from "@/components/animations/hero-entrance";

const PRAYER_TIMES = [
  { name: "Fajr", time: "04:23" },
  { name: "Dhuhr", time: "12:02" },
  { name: "Asr", time: "16:34" },
  { name: "Maghrib", time: "18:23" },
  { name: "Isha", time: "19:41" },
];

export function Hero() {
  return (
    <section className="w-full bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto flex items-center gap-16 px-16 py-28">
        {/* Left — copy */}
        <div className="flex-1 flex flex-col gap-7">
          <HeroEntrance delay={0}>
            <Badge className="w-fit bg-accent text-secondary border-0 rounded-full px-4 py-1 text-xs font-medium">
              Now live across Bangladesh
            </Badge>
          </HeroEntrance>

          <HeroEntrance delay={0.1}>
            <h1 className="font-heading text-5xl font-bold leading-[1.1] tracking-tight text-white max-w-lg">
              Connect with your nearest Masjid
            </h1>
          </HeroEntrance>

          <HeroEntrance delay={0.2}>
            <p className="text-secondary/90 text-lg leading-relaxed max-w-md">
              Find nearby masjids, check prayer times, and stay connected with
              your community — all from one platform.
            </p>
          </HeroEntrance>

          <HeroEntrance delay={0.3} className="flex items-center gap-3 pt-1">
            <Button
              asChild
              size="lg"
              className="bg-secondary text-primary hover:bg-secondary/90 font-semibold px-8"
            >
              <Link href="#features">Find a Masjid</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-secondary/50 text-secondary bg-transparent hover:bg-accent hover:text-white hover:border-accent px-8"
            >
              <Link href="/login">Admin Panel →</Link>
            </Button>
          </HeroEntrance>
        </div>

        {/* Right — masjid preview card */}
        <HeroCardEntrance className="hidden lg:flex flex-col gap-4 w-[420px] shrink-0 bg-accent rounded-2xl p-6">
          <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wide">
            Nearest Masjid · 0.4 km away
          </p>

          <div className="bg-primary rounded-xl p-5 flex flex-col gap-4">
            <div>
              <p className="font-heading font-bold text-white text-base leading-snug">
                Baitul Mukarram National Mosque
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Topkhana Rd, Dhaka 1000
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 text-xs bg-accent text-secondary rounded-full px-2.5 py-1">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </span>
              <span className="text-xs bg-accent text-secondary rounded-full px-2.5 py-1">
                Sisters Section
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-1 border-t border-white/10">
              {PRAYER_TIMES.map(({ name, time }) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{name}</span>
                  <span className="text-sm font-bold text-secondary font-mono">
                    {time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { num: "300K+", label: "Masjids" },
              { num: "1M+", label: "Users" },
            ].map(({ num, label }) => (
              <div
                key={label}
                className="bg-primary rounded-xl px-4 py-3 flex flex-col gap-1"
              >
                <span className="font-heading font-bold text-xl text-white font-mono">
                  {num}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </HeroCardEntrance>
      </div>
    </section>
  );
}
