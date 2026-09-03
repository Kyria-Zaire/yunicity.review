"use client";

import { NeighborhoodDetailMapPreview } from "@/components/neighborhoods/detail/shared";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_AMBIANCE_LINE,
  NEIGHBORHOOD_DETAIL_MOBILE_BRIEF_TITLE,
  NEIGHBORHOOD_DETAIL_MOBILE_FOLLOW_SHORT,
  NEIGHBORHOOD_DETAIL_MOBILE_FOLLOWING,
  NEIGHBORHOOD_DETAIL_MOBILE_HOME_UNDEFINED,
  NEIGHBORHOOD_DETAIL_MOBILE_IS_FOLLOWING,
  NEIGHBORHOOD_DETAIL_MOBILE_NOT_FOLLOWING,
  NEIGHBORHOOD_DETAIL_MOBILE_OPEN_MAP,
  NEIGHBORHOOD_DETAIL_MOBILE_RELATION_TITLE,
  NEIGHBORHOOD_DETAIL_MOBILE_SECTOR,
  NEIGHBORHOOD_DETAIL_MOBILE_SET_HOME_SHORT,
} from "@yunicity/utils";
import { Cloud, Home, Map, MapPinned } from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailMobileOverviewProps = {
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

export function NeighborhoodDetailMobileOverview({
  detail,
  name,
  ambianceLine,
  sectorHint,
  mapHref,
  isFollowing,
  isHome,
  onToggleFollow,
  onSetHome,
}: NeighborhoodDetailMobileOverviewProps) {
  return (
    <div id="nd-mobile-overview" className="neighborhood-detail-section space-y-4">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">
          {NEIGHBORHOOD_DETAIL_MOBILE_RELATION_TITLE}
        </h2>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 flex-1 text-sm text-neutral-600">
              {isFollowing
                ? NEIGHBORHOOD_DETAIL_MOBILE_IS_FOLLOWING(name)
                : NEIGHBORHOOD_DETAIL_MOBILE_NOT_FOLLOWING(name)}
            </p>
            <button
              type="button"
              onClick={onToggleFollow}
              className={`inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${
                isFollowing
                  ? "border border-yunicity-primary/30 bg-yunicity-primary/5 text-yunicity-primary"
                  : "bg-yunicity-primary text-white"
              }`}
            >
              {isFollowing ? NEIGHBORHOOD_DETAIL_MOBILE_FOLLOWING : NEIGHBORHOOD_DETAIL_MOBILE_FOLLOW_SHORT}
            </button>
          </div>
          <div className="border-t border-neutral-100" />
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 flex-1 text-sm text-neutral-600">
              {isHome ? `Quartier de vie : ${name}` : NEIGHBORHOOD_DETAIL_MOBILE_HOME_UNDEFINED}
            </p>
            <button
              type="button"
              onClick={onSetHome}
              disabled={isHome}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 disabled:opacity-70"
            >
              <Home className="h-3.5 w-3.5" aria-hidden />
              {isHome ? "Défini" : NEIGHBORHOOD_DETAIL_MOBILE_SET_HOME_SHORT}
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-sm font-bold text-neutral-950">
            {NEIGHBORHOOD_DETAIL_MOBILE_BRIEF_TITLE(name)}
          </h2>
        </div>
        <div className="flex gap-3 p-3">
          <div className="w-[42%] shrink-0 overflow-hidden rounded-xl">
            <NeighborhoodDetailMapPreview
              detail={detail}
              mapHref={mapHref}
              title={NEIGHBORHOOD_DETAIL_MOBILE_BRIEF_TITLE(name)}
              heightClassName="h-[108px]"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 py-1">
            <p className="inline-flex items-start gap-2 text-sm text-neutral-700">
              <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              <span>{NEIGHBORHOOD_DETAIL_MOBILE_SECTOR(detail.city, sectorHint)}</span>
            </p>
            <p className="inline-flex items-start gap-2 text-sm text-neutral-700">
              <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              <span>{NEIGHBORHOOD_DETAIL_MOBILE_AMBIANCE_LINE(ambianceLine)}</span>
            </p>
          </div>
        </div>
        <div className="px-3 pb-3">
          <Link
            href={mapHref}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/35 text-sm font-semibold text-yunicity-primary"
          >
            <Map className="h-4 w-4" aria-hidden />
            {NEIGHBORHOOD_DETAIL_MOBILE_OPEN_MAP}
          </Link>
        </div>
      </section>
    </div>
  );
}
