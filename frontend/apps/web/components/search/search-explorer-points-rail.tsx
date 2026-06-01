"use client";

import type { ExplorerPointsTip } from "@yunicity/utils";
import {
  SEARCH_EXPLORER_POINTS_RAIL_CTA,
  SEARCH_EXPLORER_POINTS_RAIL_SUBTITLE,
  SEARCH_EXPLORER_POINTS_RAIL_TITLE,
  explorerPointsTipsForCarousel,
} from "@yunicity/utils";
import {
  Bookmark,
  CalendarHeart,
  Compass,
  Gift,
  MapPin,
  Sparkles,
  Stamp,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, type CSSProperties } from "react";

const TIP_ICONS: Record<string, LucideIcon> = {
  "activate-passport": Sparkles,
  "partner-stamp": Stamp,
  "redeem-offer": Gift,
  "flash-offer": Zap,
  "local-post": Bookmark,
  "event-interest": CalendarHeart,
  "join-tribe": Users,
  "explore-neighborhood": MapPin,
  "discover-place": Compass,
  "level-silver": TrendingUp,
};

function buildMarqueeLoop(tips: ExplorerPointsTip[]): ExplorerPointsTip[] {
  if (tips.length === 0) return [];
  const segment = tips.length < 6 ? [...tips, ...tips] : tips;
  return [...segment, ...segment];
}

function PointsTipCard({ tip }: { tip: ExplorerPointsTip }) {
  const Icon = TIP_ICONS[tip.id] ?? Sparkles;

  return (
    <Link
      href={tip.href}
      className="group flex h-full w-[15.5rem] shrink-0 flex-col rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-yunicity-primary/25 hover:shadow-md sm:w-[16.5rem]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yunicity-primary-soft text-yunicity-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
          {tip.pointsHint}
        </span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-bold text-neutral-900 group-hover:text-yunicity-primary">
        {tip.title}
      </h3>
      <p className="mt-1.5 line-clamp-3 flex-1 text-xs leading-relaxed text-neutral-600">{tip.body}</p>
      <span className="mt-3 text-xs font-semibold text-yunicity-primary">En savoir plus →</span>
    </Link>
  );
}

export function SearchExplorerPointsRail() {
  const tips = useMemo(() => explorerPointsTipsForCarousel(), []);
  const loopTips = useMemo(() => buildMarqueeLoop(tips), [tips]);
  const segmentLength = loopTips.length / 2;

  const marqueeStyle = useMemo(
    () =>
      ({
        "--transit-marquee-duration": `${Math.max(32, segmentLength * 5)}s`,
      }) as CSSProperties,
    [segmentLength],
  );

  if (tips.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="explorer-points-rail-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="explorer-points-rail-title" className="text-lg font-bold text-neutral-900">
            {SEARCH_EXPLORER_POINTS_RAIL_TITLE}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-neutral-600">{SEARCH_EXPLORER_POINTS_RAIL_SUBTITLE}</p>
        </div>
        <Link
          href="/passport"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {SEARCH_EXPLORER_POINTS_RAIL_CTA}
        </Link>
      </div>

      <div className="relative -mx-1 px-1">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-[var(--yunicity-background)] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-[var(--yunicity-background)] to-transparent"
          aria-hidden
        />

        <div className="transit-marquee-viewport pb-1">
          <ul
            className="transit-marquee-track"
            style={marqueeStyle}
            aria-label={`${SEARCH_EXPLORER_POINTS_RAIL_TITLE} — défilement automatique`}
          >
            {loopTips.map((tip, index) => (
              <li
                key={`${tip.id}-${index}`}
                className="shrink-0"
                aria-hidden={index >= segmentLength ? true : undefined}
              >
                <PointsTipCard tip={tip} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
