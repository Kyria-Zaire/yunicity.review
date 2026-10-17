"use client";

import type { NeighborhoodDetail } from "@yunicity/types";
import {
  LOCAL_VIDEO_TEASER_NEIGHBORHOOD_EMPTY,
  LOCAL_VIDEO_TEASER_SECTION_NEIGHBORHOOD,
  VIDEOS_PORTAL_PUBLISH_CTA,
  buildLocalVideoTeaserViewFromNeighborhoodVideo,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo } from "react";

import { LocalVideoTeaserRail } from "@/components/videos/local-video-teaser-rail";

/**
 * Vidéos du quartier (VIDEO-03-TEASERS-03).
 *
 * Les vidéos arrivent DÉJÀ dans la charge utile du détail quartier, filtrées
 * côté serveur sur le vrai `neighborhood_id` : aucune requête supplémentaire,
 * et aucun rattachement territorial deviné côté client. Un quartier inactif
 * répond 404 sur toute la route — ses vidéos sont donc inatteignables par
 * construction, sans filtre à maintenir ici.
 *
 * Le chargement et l'erreur appartiennent à `NeighborhoodDetailScreen`, qui ne
 * monte pas cette section sans données. Reste l'état vide, traité ici : sans
 * vidéo, un quartier n'est pas en panne — c'est une invitation à publier.
 */
export function NeighborhoodDetailVideos({
  detail,
  layout = "scroll",
}: {
  detail: NeighborhoodDetail;
  layout?: "stack" | "scroll";
}) {
  const displayName = detail.hero?.display_name ?? detail.display_name;

  const views = useMemo(
    () =>
      detail.videos.map((video) =>
        buildLocalVideoTeaserViewFromNeighborhoodVideo(video, displayName),
      ),
    [detail.videos, displayName],
  );

  if (views.length === 0) {
    return (
      <section
        data-neighborhood-videos="empty"
        aria-label={LOCAL_VIDEO_TEASER_SECTION_NEIGHBORHOOD}
        className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 sm:p-5"
      >
        <h2 className="text-base font-bold text-neutral-900">
          {LOCAL_VIDEO_TEASER_SECTION_NEIGHBORHOOD}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          {LOCAL_VIDEO_TEASER_NEIGHBORHOOD_EMPTY}
        </p>
        <Link
          href="/videos/new"
          className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
        >
          {VIDEOS_PORTAL_PUBLISH_CTA}
        </Link>
      </section>
    );
  }

  return (
    <div data-neighborhood-videos="filled">
      <LocalVideoTeaserRail
        views={views}
        title={LOCAL_VIDEO_TEASER_SECTION_NEIGHBORHOOD}
        seeAllHref={`/videos?city=${encodeURIComponent(detail.city)}`}
        layout={layout}
      />
    </div>
  );
}
