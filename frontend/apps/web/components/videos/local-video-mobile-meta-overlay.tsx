"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEO_DETAIL_FOLLOW,
  VIDEO_DETAIL_FOLLOW_SOON,
  VIDEOS_DESKTOP_DISCOVER_PLACE,
  VIDEOS_DESKTOP_SEE_ON_MAP,
  buildVideoAuthorProfileHref,
  buildVideosPortraitHashtags,
  formatVideoAuthorDisplayName,
  formatVideosPortraitOriginalSound,
  resolveLocalVideoTeaserTitle,
  resolveVideosPortraitDiscoverCta,
  resolveVideosPortraitMapHref,
  resolveVideosPortraitPlaceLabel,
} from "@yunicity/utils";
import { ChevronRight, MapPin, Music2 } from "lucide-react";
import Link from "next/link";

type LocalVideoMobileMetaOverlayProps = {
  item: LocalVideoFeedItem;
};

function authorInitials(item: LocalVideoFeedItem): string {
  const name = item.author.full_name?.trim() || item.author.username || "YU";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Bandeau bas-gauche — auteur, lieu, titre, hashtags, CTAs (maquette mobile Reels). */
export function LocalVideoMobileMetaOverlay({ item }: LocalVideoMobileMetaOverlayProps) {
  const displayName = formatVideoAuthorDisplayName(item);
  const profileHref = buildVideoAuthorProfileHref(item);
  const title = resolveLocalVideoTeaserTitle(item);
  const placeLabel = resolveVideosPortraitPlaceLabel(item);
  const hashtags = buildVideosPortraitHashtags(item);
  const mapHref = resolveVideosPortraitMapHref(item);
  const discoverCta = resolveVideosPortraitDiscoverCta(item);
  const originalSound = formatVideosPortraitOriginalSound(item);

  return (
    <div className="pointer-events-auto min-w-0 space-y-2.5 pr-2 text-white">
      <div className="flex flex-wrap items-center gap-2">
        {profileHref ? (
          <Link href={profileHref} className="inline-flex min-w-0 items-center gap-1.5">
            {item.author.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.author.avatar_url}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white/80"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-[11px] font-bold text-white ring-2 ring-white/80">
                {authorInitials(item)}
              </span>
            )}
            <span className="truncate text-sm font-bold">{displayName}</span>
          </Link>
        ) : (
          <span className="truncate text-sm font-bold">{displayName}</span>
        )}
        <button
          type="button"
          disabled
          title={VIDEO_DETAIL_FOLLOW_SOON}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-yunicity-primary px-3 py-1 text-xs font-semibold text-white opacity-90"
        >
          {VIDEO_DETAIL_FOLLOW}
        </button>
      </div>

      {placeLabel ? (
        <p className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-400/60 bg-neutral-950/55 px-3 py-1 text-xs font-semibold text-emerald-200">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{placeLabel}</span>
        </p>
      ) : null}

      <div className="space-y-1">
        <p className="text-base font-bold leading-snug drop-shadow-sm">{title}</p>
        {hashtags.length > 0 ? (
          <p className="text-sm font-medium text-white/85">{hashtags.join(" ")}</p>
        ) : null}
      </div>

      {mapHref ? (
        <Link
          href={mapHref}
          className="inline-flex w-full max-w-[16rem] items-center justify-center gap-2 rounded-xl border border-yunicity-primary/70 bg-neutral-950/55 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-neutral-950/70"
        >
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {VIDEOS_DESKTOP_SEE_ON_MAP}
        </Link>
      ) : null}

      {discoverCta ? (
        <Link
          href={discoverCta.href}
          className="inline-flex max-w-full items-center gap-1 text-sm font-semibold text-white/90 transition hover:text-white"
        >
          <span className="truncate">{discoverCta.label || VIDEOS_DESKTOP_DISCOVER_PLACE}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
        </Link>
      ) : null}

      <p className="inline-flex max-w-full items-center gap-2 text-xs text-white/75">
        <Music2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{originalSound}</span>
      </p>
    </div>
  );
}
