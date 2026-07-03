"use client";

import { useState, type ReactNode } from "react";

type MapMediaThumbnailProps = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
};

/** Map rail/carousel thumbnail with graceful fallback when CDN/static assets 404. */
export function MapMediaThumbnail({
  src,
  alt = "",
  className,
  fallback,
}: MapMediaThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const safeSrc = src?.trim();

  if (!safeSrc || failed) {
    return fallback ?? <div className={`bg-neutral-100 ${className ?? ""}`} aria-hidden />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={safeSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
