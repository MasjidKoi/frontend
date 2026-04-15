"use client";

import { motion, type Variants } from "framer-motion";
import { ReactNode } from "react";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

interface HeroEntranceProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

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
      transition={{ duration: 0.75, delay: 0.4, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
