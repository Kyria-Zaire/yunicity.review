"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import { Drawer } from "@yunicity/ui/primitives";
import {
  VIDEOS_DESKTOP_SEE_ON_MAP,
  VIDEOS_MOBILE_DESCRIPTION_CLOSE,
  VIDEOS_MOBILE_DESCRIPTION_TITLE,
  buildVideoAuthorProfileHref,
  buildVideosPortraitHashtags,
  formatVideoAuthorDisplayName,
  formatVideoTemporalLabel,
  formatVideosMobileViews,
  formatVideosPortraitOriginalSound,
  resolveLocalVideoTeaserTitle,
  resolveVideoRankingReason,
  resolveVideosPortraitDiscoverCta,
  resolveVideosPortraitMapHref,
  resolveVideosPortraitPlaceLabel,
} from "@yunicity/utils";
import { MapPin, Music2 } from "lucide-react";
import Link from "next/link";
import type { RefObject } from "react";

import { AvatarImage } from "@/components/avatar-image";
import { Z_INDEX } from "@/lib/layout/z-index";
import { VIDEO_CANVAS_FOCUS } from "@/lib/videos/video-playback-a11y";

type LocalVideoDescriptionSheetProps = {
  video: LocalVideoFeedItem | null;
  onClose: () => void;
  /** Bouton « plus » : cible explicite du retour du focus (WebKit). */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "YU";
}

/**
 * Feuille Description (écran E, v2.3) : tout ce que la légende courte ne montre pas.
 * La vidéo est en pause derrière (règle des panneaux, `usePauseWhileOpen`).
 */
export function LocalVideoDescriptionSheet({ video, onClose, returnFocusRef }: LocalVideoDescriptionSheetProps) {
  // Toujours monté : la primitive place le focus à la transition fermé → ouvert.
  return (
    <Drawer
      open={Boolean(video)}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={VIDEOS_MOBILE_DESCRIPTION_TITLE}
      closeLabel={VIDEOS_MOBILE_DESCRIPTION_CLOSE}
      zIndex={Z_INDEX.VIDEO_COMMENTS}
      returnFocusRef={returnFocusRef}
      className="max-h-[65dvh] rounded-t-3xl bg-white"
    >
      {video ? <DescriptionContent video={video} /> : null}
    </Drawer>
  );
}

function DescriptionContent({ video }: { video: LocalVideoFeedItem }) {
  const displayName = formatVideoAuthorDisplayName(video);
  const profileHref = buildVideoAuthorProfileHref(video);
  const handle = video.author.username?.trim() ? `@${video.author.username.replace(/^@/, "")}` : null;
  const paragraphs = (video.description ?? "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const hashtags = buildVideosPortraitHashtags(video);
  const placeLabel = resolveVideosPortraitPlaceLabel(video);
  const placeHref = resolveVideosPortraitDiscoverCta(video)?.href ?? null;
  const mapHref = resolveVideosPortraitMapHref(video);
  const raison = resolveVideoRankingReason(video);

  const account = (
    <>
      {video.author.avatar_url ? (
        <AvatarImage src={video.author.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-[13px] font-bold text-white">
          {initials(displayName)}
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] font-bold text-neutral-900">{displayName}</span>
        {handle ? <span className="truncate text-[13px] text-neutral-500">{handle}</span> : null}
      </span>
    </>
  );

  return (
    <div data-video-description="" className="flex flex-col gap-3 pb-4">
      {profileHref ? (
        <Link href={profileHref} className={`flex min-h-11 items-center gap-2.5 ${VIDEO_CANVAS_FOCUS}`}>
          {account}
        </Link>
      ) : (
        <div className="flex min-h-11 items-center gap-2.5">{account}</div>
      )}

      <h3 className="m-0 text-lg font-bold leading-6 text-neutral-900">{resolveLocalVideoTeaserTitle(video)}</h3>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="m-0 whitespace-pre-line text-[15px] leading-[23px] text-neutral-900">
          {paragraph}
        </p>
      ))}
      {hashtags.length > 0 ? <p className="m-0 text-[15px] leading-[23px] text-neutral-700">{hashtags.join(" ")}</p> : null}
      <p className="m-0 text-[13px] text-neutral-500">
        {formatVideoTemporalLabel(video.published_at ?? video.created_at)} · {formatVideosMobileViews(video.view_count)}
      </p>

      <div className="flex flex-col gap-2 border-t border-neutral-200 pt-3">
        {placeLabel || mapHref ? (
          <div className="flex flex-wrap items-center gap-2">
            {placeLabel && placeHref ? (
              <Link
                href={placeHref}
                className={`inline-flex h-8 items-center gap-1 rounded-full bg-[#EEF0FF] px-3 text-[13px] font-semibold text-yunicity-primary ${VIDEO_CANVAS_FOCUS}`}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {placeLabel}
              </Link>
            ) : placeLabel ? (
              <span className="inline-flex h-8 items-center gap-1 rounded-full bg-[#EEF0FF] px-3 text-[13px] font-semibold text-yunicity-primary">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {placeLabel}
              </span>
            ) : null}
            {mapHref ? (
              <Link href={mapHref} className={`inline-flex min-h-11 items-center text-sm font-semibold text-yunicity-primary underline ${VIDEO_CANVAS_FOCUS}`}>
                {VIDEOS_DESKTOP_SEE_ON_MAP}
              </Link>
            ) : null}
          </div>
        ) : null}
        {raison.visible ? <p className="m-0 text-[13px] text-neutral-500">{raison.label}</p> : null}
        <p className="m-0 inline-flex items-center gap-1.5 text-[13px] text-neutral-700">
          <Music2 className="h-3.5 w-3.5" aria-hidden />
          {formatVideosPortraitOriginalSound(video)}
        </p>
      </div>
    </div>
  );
}
