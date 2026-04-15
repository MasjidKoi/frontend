"use client";

import { FadeUp } from "@/components/animations/fade-up";
import { Stagger, StaggerItem } from "@/components/animations/stagger";

const STEPS = [
  {
    num: "01",
    title: "NGO registers masjids",
    description:
      "Platform admin onboards and verifies masjids, assigns credentials to their representatives.",
  },
  {
    num: "02",
    title: "Masjid admin sets up",
    description:
      "They add prayer times, facilities, photos, and post announcements from the web admin panel.",
  },
  {
    num: "03",
    title: "Community connects",
    description:
      "Users find nearby masjids, check prayer times, and read announcements — no account required.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full bg-secondary py-20">
      <div className="max-w-5xl mx-auto px-8 flex flex-col items-center gap-14">
        {/* Header */}
        <FadeUp className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-semibold text-accent tracking-[0.15em] uppercase">
            How it works
          </span>
          <h2 className="font-heading text-4xl font-bold text-foreground max-w-md leading-tight">
            Simple for communities,{" "}
            <br className="hidden md:block" />
            powerful for admins
          </h2>
        </FadeUp>

        {/* Steps */}
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {STEPS.map(({ num, title, description }) => (
            <StaggerItem key={num}>
              <div className="bg-white rounded-2xl p-7 flex flex-col gap-3 shadow-sm h-full">
                <span className="font-mono font-bold text-4xl text-accent">
                  {num}
                </span>
                <h3 className="font-heading text-base font-bold text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
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
