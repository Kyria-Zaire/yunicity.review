"use client";

import type { CulturalPlaceDetail } from "@yunicity/types";
import type { PlaceDetailDesktopBadge } from "@yunicity/utils";
import {
  PLACE_DETAIL_DESKTOP_MAP,
  PLACE_DETAIL_DESKTOP_MORE,
  PLACE_DETAIL_DESKTOP_SAVE,
  PLACE_DETAIL_DESKTOP_SAVE_SOON,
  PLACE_DETAIL_DESKTOP_SHARE,
  PLACE_DETAIL_DESKTOP_SHARE_COPIED,
  PLACE_DETAIL_DESKTOP_VERIFIED,
  PLACE_DETAIL_DESKTOP_VISITED,
  PLACE_DETAIL_DESKTOP_VISITED_SOON,
  buildPlaceDetailDesktopMapHref,
  buildPlaceDetailDesktopSharePath,
  culturalPlaceLocationLine,
  placeDetailDesktopIsVerified,
} from "@yunicity/utils";
import { BadgeCheck, Bookmark, CheckCircle2, MapPin, MoreHorizontal, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type PlaceDesktopDetailMetaProps = {
  place: CulturalPlaceDetail;
  badges: PlaceDetailDesktopBadge[];
  subtitle: string;
};

export function PlaceDesktopDetailMeta({ place, badges, subtitle }: PlaceDesktopDetailMetaProps) {
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
      setShareHint(PLACE_DETAIL_DESKTOP_SHARE_COPIED);
      window.setTimeout(() => setShareHint(null), 2000);
    } catch {
      setShareHint(null);
    }
  }

  return (
    <div className="space-y-4" data-place-desktop-detail-meta="">
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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-[2rem] sm:leading-tight">
            {place.name}
          </h1>
          {subtitle ? <p className="max-w-2xl text-base text-neutral-600">{subtitle}</p> : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              {culturalPlaceLocationLine(place)}
            </span>
            {verified ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
                {PLACE_DETAIL_DESKTOP_VERIFIED}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[280px]">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildPlaceDetailDesktopMapHref(place)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white"
            >
              <MapPin className="h-4 w-4" aria-hidden />
              {PLACE_DETAIL_DESKTOP_MAP}
            </Link>
            <button
              type="button"
              disabled
              title={PLACE_DETAIL_DESKTOP_SAVE_SOON}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800"
            >
              <Bookmark className="h-4 w-4" aria-hidden />
              {PLACE_DETAIL_DESKTOP_SAVE}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              title={PLACE_DETAIL_DESKTOP_VISITED_SOON}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {PLACE_DETAIL_DESKTOP_VISITED}
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              aria-label={PLACE_DETAIL_DESKTOP_SHARE}
            >
              <Share2 className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              disabled
              title={PLACE_DETAIL_DESKTOP_MORE}
              aria-label={PLACE_DETAIL_DESKTOP_MORE}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 opacity-60"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </button>
          </div>
          {shareHint ? <p className="text-xs text-neutral-500">{shareHint}</p> : null}
        </div>
      </div>
    </div>
  );
}
