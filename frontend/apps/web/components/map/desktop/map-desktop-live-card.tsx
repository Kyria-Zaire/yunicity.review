"use client";

import { MapMediaThumbnail } from "@/components/map/map-media-thumbnail";
import type { MapLiveDiscoveryItem, MapLiveDiscoveryKind } from "@yunicity/utils";
import { Clock } from "lucide-react";
import Link from "next/link";

function badgeStyles(kind: MapLiveDiscoveryKind): string {
  switch (kind) {
    case "passport":
      return "bg-rose-50 text-rose-700";
    case "neighborhood":
      return "bg-emerald-50 text-emerald-700";
    case "culture":
    case "event":
      return "bg-violet-50 text-violet-700";
    default:
      return "bg-violet-50 text-violet-700";
  }
}

function displayBadge(item: MapLiveDiscoveryItem): string {
  if (item.kind === "passport") return "Offre flash";
  if (item.kind === "culture" || item.kind === "event") return "Culture";
  if (item.kind === "neighborhood") return "Quartier";
  return item.badge;
}

type MapDesktopLiveCardProps = {
  item: MapLiveDiscoveryItem;
};

export function MapDesktopLiveCard({ item }: MapDesktopLiveCardProps) {
  const showLiveDot = item.kind === "neighborhood" && item.isLiveNow;

  return (
    <article
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:shadow-md"
      data-map-desktop-live-card=""
    >
      <div className="relative aspect-[16/10] bg-neutral-100">
        {item.imageUrl ? (
          <MapMediaThumbnail
            src={item.imageUrl}
            className="h-full w-full object-cover"
            fallback={
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {displayBadge(item)}
              </div>
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {displayBadge(item)}
          </div>
        )}
      </div>
      <div className="p-4">
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeStyles(item.kind)}`}
        >
          {displayBadge(item)}
        </span>
        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-neutral-950">
          {item.title}
        </h3>
        {showLiveDot ? (
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-neutral-600">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            {item.subtitle}
          </p>
        ) : item.expiresLabel ? (
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-neutral-500">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {item.expiresLabel}
          </p>
        ) : (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{item.subtitle}</p>
        )}
        <div className="mt-3">
          <Link
            href={item.href}
            className="inline-flex rounded-full border border-yunicity-primary px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5"
          >
            {item.ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
