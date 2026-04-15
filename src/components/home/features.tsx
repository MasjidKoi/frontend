"use client";

import { MapPin, Sun, Megaphone } from "lucide-react";
import { FadeUp } from "@/components/animations/fade-up";
import { Stagger, StaggerItem } from "@/components/animations/stagger";

const FEATURES = [
  {
    icon: MapPin,
    title: "Masjid Discovery",
    description:
      "Find the nearest masjid using GPS. Filter by sisters section, parking, wheelchair access, and more.",
    inverted: false,
  },
  {
    icon: Sun,
    title: "Prayer Times",
    description:
      "Auto-calculated Azan & Iqamah for all 5 prayers. Supports all 4 madhabs. Manually overridable by masjid admins.",
    inverted: true,
  },
  {
    icon: Megaphone,
    title: "Announcements",
    description:
      "Masjid admins post community announcements for Ramadan, Eid, Jumu'ah, and special events.",
    inverted: false,
  },
];

export function Features() {
  return (
    <section id="features" className="w-full bg-background py-20">
      <div className="max-w-5xl mx-auto px-8 flex flex-col items-center gap-14">
        {/* Header */}
        <FadeUp className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-semibold text-accent tracking-[0.15em] uppercase">
            Features
          </span>
          <h2 className="font-heading text-4xl font-bold text-foreground max-w-md leading-tight">
            Everything your community needs
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
            From masjid discovery to prayer times and announcements — MasjidKoi
            is a complete platform for Muslim communities.
          </p>
        </FadeUp>

        {/* Cards */}
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {FEATURES.map(({ icon: Icon, title, description, inverted }) => (
            <StaggerItem key={title}>
              <div
                className={`rounded-2xl p-7 flex flex-col gap-4 h-full ${
                  inverted
                    ? "bg-primary text-primary-foreground"
                    : "bg-white shadow-sm border border-border/40"
                }`}
              >
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                    inverted ? "bg-accent" : "bg-primary"
                  }`}
                >
                  <Icon className="h-5 w-5 text-secondary" />
                </div>
                <h3
                  className={`font-heading text-lg font-bold ${
                    inverted ? "text-white" : "text-foreground"
                  }`}
                >
                  {title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    inverted ? "text-secondary/80" : "text-muted-foreground"
                  }`}
                >
                  {description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
