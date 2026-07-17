import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Semantic status tones, mapped to design tokens (see globals.css).
 * Use these instead of hardcoded hex status colors so pills follow the
 * theme (including dark mode) and stay consistent across the app.
 *
 *   active / published / completed / approved   -> success
 *   pending / scheduled / in-review / open      -> warning
 *   suspended / failed / rejected / cancelled    -> error
 *   in-progress / reviewed                       -> info
 *   refunded / closed / neutral                  -> neutral
 */
export type StatusTone = "success" | "warning" | "error" | "info" | "neutral"

/** Color-only classes for a given tone (bg + text). */
export const statusToneClasses: Record<StatusTone, string> = {
  success: "bg-primary-soft text-primary",
  warning: "bg-accent-gold-soft text-accent-gold",
  error: "bg-error-soft text-error",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
}

const statusBadgeBase =
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"

/**
 * A uniform status pill. Standardizes height / radius / padding so status
 * indicators look identical everywhere; pass a semantic `tone`.
 */
function StatusBadge({
  tone,
  className,
  ...props
}: React.ComponentProps<"span"> & { tone: StatusTone }) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeBase, statusToneClasses[tone], className)}
      {...props}
    />
  )
}

export { StatusBadge }
