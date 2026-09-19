"use client";

import type { CulturalPlaceDetail } from "@yunicity/types";
import type { PlaceDetailDesktopBadge } from "@yunicity/utils";
import {
  PLACE_DETAIL_MEDIUM_MAP,
  PLACE_DETAIL_MEDIUM_SAVE,
  PLACE_DETAIL_MEDIUM_SAVE_SOON,
  PLACE_DETAIL_MEDIUM_SHARE,
  PLACE_DETAIL_MEDIUM_SHARE_COPIED,
  PLACE_DETAIL_MEDIUM_VERIFIED,
  PLACE_DETAIL_MEDIUM_VISITED,
  PLACE_DETAIL_MEDIUM_VISITED_SOON,
  buildPlaceDetailDesktopMapHref,
  buildPlaceDetailDesktopSharePath,
  culturalPlaceLocationLine,
  placeDetailDesktopIsVerified,
} from "@yunicity/utils";
import { BadgeCheck, Bookmark, CheckCircle2, MapPin, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type PlaceMediumDetailMetaProps = {
  place: CulturalPlaceDetail;
  badges: PlaceDetailDesktopBadge[];
  subtitle: string;
};

export function PlaceMediumDetailMeta({ place, badges, subtitle }: PlaceMediumDetailMetaProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);
  const verified = placeDetailDesktopIsVerified(place);

  async function handleShare() {
    const path = buildPlaceDetailDesktopSharePath(place);
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: place.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(PLACE_DETAIL_MEDIUM_SHARE_COPIED);
      window.setTimeout(() => setShareHint(null), 2000);
    } catch {
      setShareHint(null);
    }
  }

  return (
    <div className="space-y-4" data-place-medium-detail-meta="">
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
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{place.name}</h1>
        {subtitle ? <p className="text-base text-neutral-600">{subtitle}</p> : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {culturalPlaceLocationLine(place)}
          </span>
          {verified ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
              <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
              {PLACE_DETAIL_MEDIUM_VERIFIED}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildPlaceDetailDesktopMapHref(place)}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white sm:flex-none sm:min-w-[9.5rem]"
        >
          <MapPin className="h-4 w-4" aria-hidden />
          {PLACE_DETAIL_MEDIUM_MAP}
        </Link>
        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MEDIUM_SAVE_SOON}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 sm:flex-none sm:min-w-[9.5rem]"
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          {PLACE_DETAIL_MEDIUM_SAVE}
        </button>
        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MEDIUM_VISITED_SOON}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 sm:flex-none sm:min-w-[11rem]"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {PLACE_DETAIL_MEDIUM_VISITED}
        </button>
        <button
          type="button"
          onClick={() => void handleShare()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
          aria-label={PLACE_DETAIL_MEDIUM_SHARE}
        >
          <Share2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {shareHint ? <p className="text-xs text-neutral-500">{shareHint}</p> : null}
    </div>
  );
}
