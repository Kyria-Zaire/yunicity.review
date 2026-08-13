"use client";

import type { MapAroundYouItem } from "@yunicity/utils";
import {
  MAP_MOBILE_BOOKMARK_ARIA,
  MAP_MOBILE_BOOKMARK_SOON,
  MAP_MOBILE_EVENT_BADGE,
  MAP_MOBILE_WALK_MINUTES,
  MAP_PORTAL_AROUND_EMPTY,
  MAP_PORTAL_AROUND_SEE_ALL,
  MAP_PORTAL_AROUND_TITLE,
  estimateMapWalkMinutes,
  formatMapDistanceShort,
} from "@yunicity/utils";
import { Bookmark, Footprints, Play } from "lucide-react";
import Link from "next/link";

import { MapMediaThumbnail } from "@/components/map/map-media-thumbnail";

type MapMobileAroundSheetProps = {
  items: MapAroundYouItem[];
  onSelectItem: (item: MapAroundYouItem) => void;
};

function AroundYouRow({
  item,
  onSelect,
}: {
  item: MapAroundYouItem;
  onSelect: () => void;
}) {
  const walkMinutes = estimateMapWalkMinutes(item.distanceMeters);
  const isEvent = item.kind === "event";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-start gap-3 py-3 text-left transition hover:bg-neutral-50"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
          {item.imageUrl ? (
            <MapMediaThumbnail
              src={item.imageUrl}
              className="h-full w-full object-cover"
              fallback={
                <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
                  {item.meta}
                </div>
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-neutral-100 text-[10px] text-neutral-400">
              {item.meta}
            </div>
          )}
          {isEvent ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
                <Play className="ml-0.5 h-3 w-3 fill-neutral-900 text-neutral-900" aria-hidden />
              </span>
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-bold text-neutral-900">{item.title}</p>
            <button
              type="button"
              disabled
              title={MAP_MOBILE_BOOKMARK_SOON}
              aria-label={MAP_MOBILE_BOOKMARK_ARIA}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 opacity-60"
            >
              <Bookmark className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
            {item.meta}
            {item.subtitle ? ` • ${item.subtitle.split(",")[0]?.trim() ?? item.subtitle}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-600">
            <span className="inline-flex items-center gap-1">
              <Footprints className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
              {MAP_MOBILE_WALK_MINUTES(walkMinutes)}
            </span>
            {isEvent ? (
              <span className="rounded-full bg-[#FFF4EB] px-2 py-0.5 text-[10px] font-semibold text-[#EA580C]">
                {MAP_MOBILE_EVENT_BADGE}
              </span>
            ) : null}
          </div>
        </div>

        <span className="shrink-0 pt-1 text-xs font-medium text-neutral-400">
          {formatMapDistanceShort(item.distanceMeters)}
        </span>
      </button>
    </li>
  );
}

/** Bottom sheet « Autour de vous » mobile (MOBILE-MAP-01). */
export function MapMobileAroundSheet({ items, onSelectItem }: MapMobileAroundSheetProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
      <div className="pointer-events-auto max-h-[min(52dvh,420px)] rounded-t-[1.75rem] border border-neutral-200/80 bg-white shadow-[0_-10px_40px_rgba(15,23,42,0.12)]">
        <div className="flex justify-center pt-2.5" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-neutral-300" />
        </div>

        {/* T6.4-R1 — `pr-20` (80px) réserve la colonne droite occupée par le FAB Menu Yunicity
            (rond 56px + marge 16px = 72px, `CitizenYunicityMenuFab`, z-65, ancré bas-droite ≤639px).
            Sans ça, quand le sheet est court, le FAB recouvre « Voir tout → » et intercepte son tap.
            Tient sur une ligne dès 320px (16+titre+gap+lien+80 ≈ 297px). */}
        <div className="flex items-center justify-between gap-3 pb-2 pl-4 pr-20 pt-1">
          <h2 className="text-base font-bold text-neutral-900">{MAP_PORTAL_AROUND_TITLE}</h2>
          <Link href="/events" className="text-sm font-semibold text-yunicity-primary">
            {MAP_PORTAL_AROUND_SEE_ALL} →
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-neutral-500">{MAP_PORTAL_AROUND_EMPTY}</p>
        ) : (
          <ul className="divide-y divide-neutral-100 overflow-y-auto px-4 pb-4 [max-height:min(38dvh,320px)]">
            {items.map((item) => (
              <AroundYouRow
                key={`${item.kind}-${item.id}`}
                item={item}
                onSelect={() => onSelectItem(item)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
