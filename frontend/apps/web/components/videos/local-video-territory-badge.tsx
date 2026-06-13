"use client";

import type { VideoTerritoryLines } from "@yunicity/utils";
import { MapPin } from "lucide-react";

export function LocalVideoTerritoryBadge({ lines }: { lines: VideoTerritoryLines }) {
  return (
    <div className="pointer-events-none max-w-[85%] rounded-2xl bg-neutral-900/55 px-3 py-2.5 text-white backdrop-blur-sm">
      {lines.distance ? (
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <MapPin className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
          {lines.distance}
        </p>
      ) : null}
      <p className="mt-0.5 text-sm font-medium text-white/95">{lines.neighborhood}</p>
      <p className="mt-0.5 text-xs text-white/80">{lines.temporal}</p>
    </div>
  );
}
