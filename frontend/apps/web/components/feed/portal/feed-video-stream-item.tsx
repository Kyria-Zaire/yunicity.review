"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_TEASER_CTA,
  buildLocalVideoTeaserHref,
  formatLocalVideoDuration,
  formatLocalVideoTypeLabel,
  formatVideoAuthorDisplayName,
  resolveLocalVideoTeaserTitle,
} from "@yunicity/utils";
import Link from "next/link";

import { ProfileAvatar } from "@/components/profile-avatar";

/**
 * Publication vidéo du flux medium (C3-FEED-M7-R2).
 *
 * ── Pourquoi un composant dédié ──────────────────────────────────────────────
 * `LocalVideoTeaserCard` est partagée (page /videos, hero quartier, lieu,
 * événement) et dessine une vignette portrait de 72 × 120 px. La vidéo doit ici
 * se lire comme une publication du fil, DANS la même liste que les publications
 * texte et image — ce n'est pas une variante de vignette, c'est une autre
 * grammaire. Le composant partagé reste donc intact pour ses consommateurs.
 *
 * ── Ce qui n'est PAS affiché, et pourquoi ────────────────────────────────────
 * Ni Réagir, ni Discuter, ni Partager, ni Signaler. `local_videos` possède bien
 * ses propres tables de likes, commentaires et signalements, mais elles vivent
 * sur des endpoints distincts de ceux des publications : réutiliser la barre
 * d'actions des posts appellerait des contrats qui ne s'appliquent pas à cet
 * identifiant. Aucun compteur de vues non plus : la donnée existe en base mais
 * n'est pas exposée par `listLocalVideos`.
 *
 * La publication entière est UN SEUL lien vers la destination réelle
 * `/videos?video=<uuid>` : aucun contrôle imbriqué, aucun piège clavier.
 */
export function FeedVideoStreamItem({ video }: { video: LocalVideoFeedItem }) {
  const titre = resolveLocalVideoTeaserTitle(video);
  const auteur = formatVideoAuthorDisplayName(video);

  return (
    /* La SURFACE primaire est portee par le wrapper, jamais par le lien : le
       contrat M3.3B interdit ce marqueur sur un controle. */
    <div
      data-feed-medium-surface="primary"
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
    >
    <Link
      href={buildLocalVideoTeaserHref(video.id)}
      data-feed-video-stream-item=""
      className="group block p-4 transition hover:bg-neutral-50/60 sm:p-5"
    >
      <div data-feed-video-stream-header="" className="flex items-center gap-3">
        <ProfileAvatar name={auteur} size="sm" />
        <div className="min-w-0">
          <p
            data-feed-video-stream-author=""
            className="truncate text-sm font-bold text-neutral-900"
          >
            {auteur}
          </p>
          <p data-feed-video-stream-context="" className="truncate text-xs text-neutral-500">
            {video.neighborhood_name} · {formatLocalVideoTypeLabel(video.video_type)}
          </p>
        </div>
      </div>

      <p
        data-feed-video-stream-headline=""
        className="mt-3 text-[15px] font-semibold leading-snug text-neutral-900"
      >
        {titre}
      </p>

      <div
        data-feed-video-stream-media=""
        className="relative mt-3 w-full overflow-hidden rounded-xl bg-neutral-200"
        style={{ aspectRatio: "16 / 9" }}
      >
        {/* Miniature seule — aucun <video>, donc ni autoplay ni son. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-feed-video-stream-thumb=""
          src={video.thumbnail_url}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <span
          data-feed-video-stream-duration=""
          className="absolute bottom-2 right-2 rounded-md bg-neutral-950/75 px-2 py-0.5 text-xs font-semibold tabular-nums text-white"
        >
          {formatLocalVideoDuration(video.duration_seconds)}
        </span>
      </div>

      <p
        data-feed-video-stream-cta=""
        className="mt-3 text-sm font-semibold text-yunicity-primary group-hover:underline"
      >
        {LOCAL_VIDEO_TEASER_CTA}
      </p>
    </Link>
    </div>
  );
}
