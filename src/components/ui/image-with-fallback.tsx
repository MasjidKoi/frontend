"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * <img> that degrades to a muted placeholder when the source fails to load,
 * instead of the browser's broken-image icon. Used for masjid photo galleries,
 * where a stored URL can be unreachable (e.g. a moved/removed CDN object).
 * `className` is applied to both the image and the placeholder so layout
 * (sizing, aspect ratio) stays identical either way.
 */
export function ImageWithFallback({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-6 w-6" />
        <span className="text-[11px] leading-none">Image unavailable</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
