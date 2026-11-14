"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  buildVideoAuthorProfileHref,
  formatVideoAuthorDisplayName,
  resolveLocalVideoTeaserTitle,
  resolveVideoRankingReason,
  resolveVideosPortraitDiscoverCta,
  resolveVideosPortraitPlaceLabel,
} from "@yunicity/utils";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

import { AvatarImage } from "@/components/avatar-image";
import { VIDEO_IMMERSIVE_FOCUS } from "@/lib/videos/video-playback-a11y";

type LocalVideoMobileMetaOverlayProps = {
  item: LocalVideoFeedItem;
  /** « plus » : ouvre la description complète (écran E). Absent : pas de bouton. */
  onExpandDescription?: () => void;
};

function authorInitials(item: LocalVideoFeedItem): string {
  const name = item.author.full_name?.trim() || item.author.username || "YU";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function captionRest(item: LocalVideoFeedItem, title: string): string | null {
  const description = item.description?.trim();
  if (!description || description.startsWith(title)) return null;
  return description;
}

/**
 * Légende mobile v2.3 (écrans A et D) : compte, légende courte sur une ligne + « plus »,
 * puce quartier et raison locale. Le texte long, les hashtags, la carte et le son original
 * vivent dans la feuille Description (écran E).
 *
 * Bloc transparent au pointeur : un appui sur le texte atteint la vidéo (pause / reprise) ;
 * seuls le profil, « plus » et la puce sont ciblables (VIDEO-MOBILE-CHROME-RETURN-01).
 */
export function LocalVideoMobileMetaOverlay({ item, onExpandDescription }: LocalVideoMobileMetaOverlayProps) {
  const displayName = formatVideoAuthorDisplayName(item);
  const profileHref = buildVideoAuthorProfileHref(item);
  const title = resolveLocalVideoTeaserTitle(item);
  const rest = captionRest(item, title);
  const placeLabel = resolveVideosPortraitPlaceLabel(item);
  const placeHref = resolveVideosPortraitDiscoverCta(item)?.href ?? null;
  // VIDEO-03 — motif du classement, décidé par l'API. Le frontend ne reconstruit rien.
  const raison = resolveVideoRankingReason(item);

  const avatar = item.author.avatar_url ? (
    <AvatarImage src={item.author.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full border-2 border-white object-cover" />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-yunicity-primary text-xs font-bold text-white">
      {authorInitials(item)}
    </span>
  );

  const chipClass =
    "inline-flex h-[30px] max-w-full items-center gap-1 rounded-full bg-white/[0.18] px-2.5 text-[13px] font-semibold text-white";

  return (
    <div data-video-caption="" className="pointer-events-none flex min-w-0 flex-col gap-1 text-white">
      <div className="flex min-w-0 items-center gap-2">
        {profileHref ? (
          <Link
            href={profileHref}
            aria-label="Profil du créateur"
            className={`pointer-events-auto inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 ${VIDEO_IMMERSIVE_FOCUS}`}
          >
            {avatar}
            <span className="truncate text-[15px] font-bold">{displayName}</span>
          </Link>
        ) : (
          <span className="inline-flex min-h-11 min-w-0 items-center gap-2">
            {avatar}
            <span className="truncate text-[15px] font-bold">{displayName}</span>
          </span>
        )}
      </div>

      <div className="flex min-w-0 items-baseline gap-1 text-sm leading-5">
        <p className="m-0 min-w-0 flex-1 truncate">
          <strong>{title}</strong>
          {rest ? ` — ${rest}` : null}
        </p>
        {onExpandDescription ? (
          <button
            type="button"
            onClick={onExpandDescription}
            aria-expanded={false}
            className={`pointer-events-auto shrink-0 font-bold text-white ${VIDEO_IMMERSIVE_FOCUS}`}
          >
            plus
          </button>
        ) : null}
      </div>

      {placeLabel || raison.visible ? (
        <div className="mt-1 flex min-w-0 items-center gap-2">
          {placeLabel && placeHref ? (
            <Link href={placeHref} className={`pointer-events-auto ${chipClass} ${VIDEO_IMMERSIVE_FOCUS}`}>
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{placeLabel}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </Link>
          ) : placeLabel ? (
            <span className={chipClass}>
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{placeLabel}</span>
            </span>
          ) : null}
          {raison.visible ? (
            // Pas de role="status" : précision de contexte, pas une alerte (VIDEO-03).
            <span className="min-w-0 truncate text-[13px] text-white">{raison.label}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
