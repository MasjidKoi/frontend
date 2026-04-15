"use client";

import { Stagger, StaggerItem } from "@/components/animations/stagger";

const STATS = [
  { num: "300,000+", label: "Masjids Registered" },
  { num: "8 Divisions", label: "Across Bangladesh" },
  { num: "5 Prayers", label: "Daily — Always Accurate" },
  { num: "4 Madhabs", label: "Hanafi · Shafi · Maliki · Hanbali" },
];

export function StatsBar() {
  return (
    <div className="w-full bg-secondary">
      <Stagger
        staggerDelay={0.08}
        className="max-w-7xl mx-auto px-16 py-6 grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        {STATS.map(({ num, label }) => (
          <StaggerItem key={label} className="flex flex-col items-center gap-1 text-center">
            <span className="font-heading text-2xl font-bold text-primary">
              {num}
            </span>
            <span className="text-sm text-secondary-foreground/70">{label}</span>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
