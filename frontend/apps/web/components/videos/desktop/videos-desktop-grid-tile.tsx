"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  buildLocalVideoTeaserHref,
  formatLocalVideoDuration,
  formatVideoAuthorDisplayName,
  resolveLocalVideoLayout,
  resolveLocalVideoTeaserTitle,
  resolveVideosPortraitPlaceLabel,
} from "@yunicity/utils";
import Link from "next/link";

import { cancelPendingGridRestorePins } from "@/hooks/use-grid-restore";
import {
  captureOverlayOpenScrollY,
  markOverlayOpenFromGrid,
} from "@/lib/videos/desktop-overlay-navigation";
import { VIDEO_CANVAS_FOCUS } from "@/lib/videos/video-playback-a11y";

type VideosDesktopGridTileProps = {
  item: LocalVideoFeedItem;
};

/**
 * Vignette grille desktop C1 — image seule (pas de `<video>`), ratio média,
 * méta titre / auteur / quartier, durée en pastille. Ouverture = lien `?video=`
 * (lecteur superposé Lot 8 — push historique via Link).
 */
export function VideosDesktopGridTile({ item }: VideosDesktopGridTileProps) {
  const title = resolveLocalVideoTeaserTitle(item);
  const href = buildLocalVideoTeaserHref(item.id);
  const layout = resolveLocalVideoLayout(item);
  const isPortrait = layout === "portrait";
  const author = formatVideoAuthorDisplayName(item);
  const place = resolveVideosPortraitPlaceLabel(item) ?? item.neighborhood_name?.trim() ?? null;
  const metaLine = place ? `${author} · ${place}` : author;
  const duration = formatLocalVideoDuration(item.duration_seconds);
  const aspect =
    item.media_width && item.media_height && item.media_width > 0 && item.media_height > 0
      ? `${item.media_width} / ${item.media_height}`
      : isPortrait
        ? "9 / 16"
        : "16 / 9";

  return (
    <article
      data-videos-desktop-grid-tile=""
      data-video-id={item.id}
      data-videos-desktop-tile-orientation={layout}
      className="videos-desktop-grid-tile mb-4"
    >
      <Link
        href={href}
        scroll={false}
        className={`group block rounded-2xl focus:outline-none ${VIDEO_CANVAS_FOCUS}`}
        aria-label={`${title} — ${metaLine}, durée ${duration}`}
        onMouseDown={(event) => {
          if (event.button !== 0) return;
          // Empêche le focus navigateur sur mousedown (recentrage si top<0 → Δ~11).
          event.preventDefault();
          cancelPendingGridRestorePins();
          captureOverlayOpenScrollY();
          markOverlayOpenFromGrid(item.id);
        }}
        onClick={() => {
          // Clavier (Entrée) : pas de mousedown souris — marquer ici.
          cancelPendingGridRestorePins();
          markOverlayOpenFromGrid(item.id);
        }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-neutral-200/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnail_url || undefined}
            alt=""
            loading="lazy"
            decoding="async"
            data-videos-media-layout={layout}
            /* C1 : portrait cover ; paysage contain (bandes = média, pas étirement). */
            className={`w-full ${isPortrait ? "object-cover" : "object-contain"}`}
            style={{ aspectRatio: aspect }}
          />
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-neutral-950/80 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
            {duration}
          </span>
        </div>
        <div className="mt-2 min-w-0 px-0.5">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
            {title}
          </h3>
          <p className="mt-0.5 truncate text-xs font-medium text-neutral-500">{metaLine}</p>
        </div>
      </Link>
    </article>
  );
}
