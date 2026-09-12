"use client";

import type { CulturalPlaceDetail } from "@yunicity/types";
import type { PlaceDetailDesktopBadge } from "@yunicity/utils";
import {
  PLACE_DETAIL_MOBILE_MAP,
  PLACE_DETAIL_MOBILE_SAVE,
  PLACE_DETAIL_MOBILE_SAVE_SOON,
  PLACE_DETAIL_MOBILE_VERIFIED,
  PLACE_DETAIL_MOBILE_VISITED,
  PLACE_DETAIL_MOBILE_VISITED_SOON,
  buildPlaceDetailDesktopMapHref,
  culturalPlaceLocationLine,
  placeDetailDesktopIsVerified,
} from "@yunicity/utils";
import { BadgeCheck, Bookmark, CheckCircle2, MapPin } from "lucide-react";
import Link from "next/link";

type PlaceMobileDetailMetaProps = {
  place: CulturalPlaceDetail;
  badges: PlaceDetailDesktopBadge[];
  subtitle: string;
};

export function PlaceMobileDetailMeta({ place, badges, subtitle }: PlaceMobileDetailMetaProps) {
  const verified = placeDetailDesktopIsVerified(place);

  return (
    <div className="space-y-4" data-place-mobile-detail-meta="">
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge.label}
            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.tone}`}
          >
            {badge.label}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{place.name}</h1>
        {subtitle ? <p className="text-sm leading-relaxed text-neutral-600">{subtitle}</p> : null}
        <div className="flex flex-col gap-1 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {culturalPlaceLocationLine(place)}
          </span>
          {verified ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
              <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
              {PLACE_DETAIL_MOBILE_VERIFIED}
            </span>
          ) : null}
        </div>
      </div>

      <Link
        href={buildPlaceDetailDesktopMapHref(place)}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white"
      >
        <MapPin className="h-4 w-4" aria-hidden />
        {PLACE_DETAIL_MOBILE_MAP}
      </Link>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MOBILE_SAVE_SOON}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-800"
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          {PLACE_DETAIL_MOBILE_SAVE}
        </button>
        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MOBILE_VISITED_SOON}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-800"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {PLACE_DETAIL_MOBILE_VISITED}
        </button>
      </div>
    </div>
  );
}
