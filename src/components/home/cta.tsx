"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/animations/fade-up";

export function CtaSection() {
  return (
    <section className="w-full bg-primary py-20">
      <div className="max-w-3xl mx-auto px-8 flex flex-col items-center gap-6 text-center">
        <FadeUp className="flex flex-col items-center gap-4">
          <h2 className="font-heading text-4xl font-bold text-white leading-tight">
            Ready to connect your community?
          </h2>
          <p className="text-secondary/80 text-base leading-relaxed max-w-md">
            Register your masjid today and help thousands of worshippers find you.
          </p>
        </FadeUp>

        <FadeUp delay={0.15} className="flex items-center gap-3 pt-2">
          <Button
            asChild
            size="lg"
            className="bg-secondary text-primary hover:bg-secondary/90 font-semibold px-8"
          >
            <Link href="/login">Register Your Masjid</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-secondary/40 text-secondary bg-transparent hover:bg-accent hover:border-accent hover:text-white px-8"
          >
            <Link href="#features">Explore Platform</Link>
          </Button>
        </FadeUp>
      </div>
    </section>
  );
}
