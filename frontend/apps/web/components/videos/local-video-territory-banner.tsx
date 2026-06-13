"use client";

import type { VideoTerritoryLines } from "@yunicity/utils";

/** Bandeau territorial — distance, marche, quartier, temporalité (C2-S4). */
export function LocalVideoTerritoryBanner({ lines }: { lines: VideoTerritoryLines }) {
  return (
    <div
      className="pointer-events-none max-w-[min(100%,20rem)] rounded-2xl border border-white/10 bg-neutral-950/65 px-4 py-3 text-white shadow-lg backdrop-blur-md"
      aria-label="Contexte territorial"
    >
      <p className="text-base font-bold leading-tight tracking-tight">{lines.distance}</p>
      {lines.walk ? (
        <p className="mt-1 text-sm font-semibold text-yunicity-primary">{lines.walk}</p>
      ) : null}
      <p className="mt-1 text-sm font-medium text-white/95">{lines.neighborhood}</p>
      <p className="mt-0.5 text-xs font-medium text-white/75">{lines.temporal}</p>
    </div>
  );
}
