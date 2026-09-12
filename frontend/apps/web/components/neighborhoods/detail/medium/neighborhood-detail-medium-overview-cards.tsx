"use client";

import { NeighborhoodDetailMapPreview } from "@/components/neighborhoods/detail/shared";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_MEDIUM_AMBIANCE_LINE,
  NEIGHBORHOOD_DETAIL_MEDIUM_BRIEF_TITLE,
  NEIGHBORHOOD_DETAIL_MEDIUM_FOLLOW,
  NEIGHBORHOOD_DETAIL_MEDIUM_FOLLOWING,
  NEIGHBORHOOD_DETAIL_MEDIUM_HOME_UNDEFINED,
  NEIGHBORHOOD_DETAIL_MEDIUM_IS_FOLLOWING,
  NEIGHBORHOOD_DETAIL_MEDIUM_NOT_FOLLOWING,
  NEIGHBORHOOD_DETAIL_MEDIUM_OPEN_MAP,
  NEIGHBORHOOD_DETAIL_MEDIUM_RELATION_HINT,
  NEIGHBORHOOD_DETAIL_MEDIUM_RELATION_TITLE,
  NEIGHBORHOOD_DETAIL_MEDIUM_SECTOR,
  NEIGHBORHOOD_DETAIL_MEDIUM_SET_HOME,
} from "@yunicity/utils";
import { Home, Map, MapPinned, Sparkles } from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailMediumOverviewCardsProps = {
  detail: NeighborhoodDetail;
  name: string;
  ambianceLine: string;
  sectorHint: string;
  mapHref: string;
  isFollowing: boolean;
  isHome: boolean;
  onToggleFollow: () => void;
  onSetHome: () => void;
};

export function NeighborhoodDetailMediumOverviewCards({
  detail,
  name,
  ambianceLine,
  sectorHint,
  mapHref,
  isFollowing,
  isHome,
  onToggleFollow,
  onSetHome,
}: NeighborhoodDetailMediumOverviewCardsProps) {
  return (
    <div
      id="nd-medium-overview"
      className="neighborhood-detail-medium-overview-grid neighborhood-detail-section"
    >
      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-sm font-bold text-neutral-950">
            {NEIGHBORHOOD_DETAIL_MEDIUM_BRIEF_TITLE(name)}
          </h2>
        </div>
        <NeighborhoodDetailMapPreview
          detail={detail}
          mapHref={mapHref}
          title={NEIGHBORHOOD_DETAIL_MEDIUM_BRIEF_TITLE(name)}
        />
        <div className="space-y-2.5 px-4 py-3">
          <p className="inline-flex items-center gap-2 text-sm text-neutral-600">
            <MapPinned className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {NEIGHBORHOOD_DETAIL_MEDIUM_SECTOR(detail.city, sectorHint)}
          </p>
          <p className="inline-flex items-center gap-2 text-sm text-neutral-600">
            <Sparkles className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {NEIGHBORHOOD_DETAIL_MEDIUM_AMBIANCE_LINE(ambianceLine)}
          </p>
          <Link
            href={mapHref}
            className="mt-1 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 hover:border-neutral-300"
          >
            <Map className="h-4 w-4 text-yunicity-primary" aria-hidden />
            {NEIGHBORHOOD_DETAIL_MEDIUM_OPEN_MAP}
          </Link>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">
          {NEIGHBORHOOD_DETAIL_MEDIUM_RELATION_TITLE}
        </h2>
        <p className="text-sm text-neutral-600">
          {isFollowing
            ? NEIGHBORHOOD_DETAIL_MEDIUM_IS_FOLLOWING(name)
            : NEIGHBORHOOD_DETAIL_MEDIUM_NOT_FOLLOWING(name)}
        </p>
        <button
          type="button"
          onClick={onToggleFollow}
          className={`inline-flex min-h-10 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
            isFollowing
              ? "border border-yunicity-primary/30 bg-yunicity-primary/5 text-yunicity-primary"
              : "bg-yunicity-primary text-white hover:bg-yunicity-primary/90"
          }`}
        >
          {isFollowing ? NEIGHBORHOOD_DETAIL_MEDIUM_FOLLOWING : NEIGHBORHOOD_DETAIL_MEDIUM_FOLLOW}
        </button>
        <p className="text-sm text-neutral-600">
          {isHome ? `Quartier de vie : ${name}` : NEIGHBORHOOD_DETAIL_MEDIUM_HOME_UNDEFINED}
        </p>
        <button
          type="button"
          onClick={onSetHome}
          disabled={isHome}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 hover:border-neutral-300 disabled:cursor-default disabled:opacity-70"
        >
          <Home className="h-4 w-4" aria-hidden />
          {isHome ? "Mon quartier de vie" : NEIGHBORHOOD_DETAIL_MEDIUM_SET_HOME}
        </button>
        <p className="text-xs leading-relaxed text-neutral-500">
          {NEIGHBORHOOD_DETAIL_MEDIUM_RELATION_HINT}
        </p>
      </section>
    </div>
  );
}
