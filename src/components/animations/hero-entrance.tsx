"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

const item = {
  hidden: { opacity: 0, y: 20 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] },
  }),
};

interface HeroEntranceProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/** Entrance animation for hero elements — fires on mount (not on scroll) */
export function HeroEntrance({ children, delay = 0, className }: HeroEntranceProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      custom={delay}
      variants={item}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Slide-in from the right for the hero card */
export function HeroCardEntrance({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.75, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
