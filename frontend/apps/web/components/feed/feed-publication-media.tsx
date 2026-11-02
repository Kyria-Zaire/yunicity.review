"use client";

import { useCallback, useState } from "react";

import {
  AuthorizedPublicationImageView,
  type MediaIntrinsicSize,
} from "@/components/feed/authorized-publication-image";
import { PublicationMediaFrame } from "@/components/feed/publication-media-frame";
import { PublicationMediaGrid, slicePublicationMediaForGrid } from "@/components/feed/publication-media-grid";
import type { FeedMediaViewerItem } from "@/lib/feed/feed-media-viewer-session";
import { useAuthorizedMediaSource } from "@/hooks/use-authorized-media-source";
import { openFeedMediaViewer } from "@/lib/feed/feed-media-viewer-session";
import {
  classifyMediaOrientation,
  type MediaOrientation,
} from "@yunicity/utils";

/**
 * Média d'une publication — responsabilité UNIQUE (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A).
 *
 * Images (MEDIA-01B/01C) : GET Bearer → Blob → décodage onLoad.
 * Cadre (MEDIA-02) : PublicationMediaFrame — ratio adaptatif + plafond viewport.
 */

/**
 * Un média est-il une vidéo, d'après son URL ?
 *
 * Exporté pour les surfaces qui doivent ÉCARTER un lot mixte avant de monter
 * la grille — le profil, dont la présentation d'origine ne rendait jamais de
 * vidéo. Le `media_type` du contrat du fil reste le signal premier ; cette
 * heuristique ne sert qu'à ne pas lui faire une confiance aveugle.
 */
export function isVideoMediaUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return (
    /\.(mp4|webm|mov|m4v)(\?|$)/.test(normalized) ||
    normalized.includes("/local-videos/") ||
    normalized.includes("/videos/")
  );
}

function IconPlay() {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function SinglePublicationImage({
  mediaUrl,
  label,
}: {
  mediaUrl: string;
  label: string;
}) {
  const { status, objectUrl, retry, markDisplayed, markDecodeFailed } =
    useAuthorizedMediaSource(mediaUrl);
  const [orientation, setOrientation] = useState<MediaOrientation | null>(null);

  const onDisplayed = useCallback(
    (size?: MediaIntrinsicSize) => {
      if (size) {
        const next = classifyMediaOrientation(size.width, size.height);
        if (next) setOrientation(next);
      }
      markDisplayed();
    },
    [markDisplayed],
  );

  const canOpenViewer = status === "ready" && Boolean(objectUrl);

  const media = (
    <AuthorizedPublicationImageView
      status={status}
      objectUrl={objectUrl}
      alt={label}
      framed
      imgClassName="feed-publication-media-img"
      onRetry={retry}
      onDisplayed={onDisplayed}
      onDecodeFailed={markDecodeFailed}
    />
  );

  return (
    <PublicationMediaFrame
      variant="feed"
      kind="image"
      orientation={orientation}
      status={status}
      className="feed-publication-media mt-3 overflow-hidden rounded-xl border border-yunicity-border bg-neutral-50"
      feedPublicationKind="image"
    >
      {canOpenViewer ? (
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget.focus();
            openFeedMediaViewer({
              mediaUrl,
              objectUrl,
              label,
            });
          }}
          aria-label="Agrandir l’image"
          className="absolute inset-0 block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yunicity-primary/50"
        >
          {media}
        </button>
      ) : (
        media
      )}
    </PublicationMediaFrame>
  );
}

function SinglePublicationVideo({ mediaUrl }: { mediaUrl: string }) {
  const [orientation, setOrientation] = useState<MediaOrientation | null>(null);

  return (
    <PublicationMediaFrame
      variant="feed"
      kind="video"
      orientation={orientation}
      status="ready"
      className="feed-publication-media relative mt-3 overflow-hidden rounded-xl border border-yunicity-border bg-neutral-900"
      feedPublicationKind="video"
    >
      <video
        src={mediaUrl}
        className="publication-media-frame__media h-full w-full object-contain object-center"
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          const next = classifyMediaOrientation(video.videoWidth, video.videoHeight);
          if (next) setOrientation(next);
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md">
          <IconPlay />
        </span>
      </div>
    </PublicationMediaFrame>
  );
}

function MultiPublicationMediaTile({
  mediaUrl,
  label,
  index,
  showOverflow,
  overflowCount,
  viewerItems,
  viewerIndex,
}: {
  mediaUrl: string;
  label: string;
  index: number;
  showOverflow: boolean;
  overflowCount: number;
  /** Liste PHOTO complète de la publication — le parcours de la visionneuse. */
  viewerItems: FeedMediaViewerItem[];
  /** Rang PHOTO de CETTE tuile dans cette liste (`-1` pour une vidéo). */
  viewerIndex: number;
}) {
  const isVideo = isVideoMediaUrl(mediaUrl);
  const { status, objectUrl, retry, markDisplayed, markDecodeFailed } = useAuthorizedMediaSource(
    isVideo ? null : mediaUrl,
  );
  const [orientation, setOrientation] = useState<MediaOrientation | null>(null);

  const onDisplayed = useCallback(
    (size?: MediaIntrinsicSize) => {
      if (size) {
        const next = classifyMediaOrientation(size.width, size.height);
        if (next) setOrientation(next);
      }
      markDisplayed();
    },
    [markDisplayed],
  );

  if (isVideo) {
    return (
      <PublicationMediaFrame
        variant="feed"
        kind="video"
        orientation={orientation}
        feedPublicationMarker={false}
        applyAspectRatio={false}
        className="publication-media-grid__tile overflow-hidden rounded-lg bg-neutral-900"
      >
        <video
          src={mediaUrl}
          className="publication-media-frame__media h-full w-full object-contain"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            const next = classifyMediaOrientation(video.videoWidth, video.videoHeight);
            if (next) setOrientation(next);
          }}
        />
        {showOverflow ? (
          <span className="publication-media-grid__overflow" aria-hidden>
            +{overflowCount}
          </span>
        ) : null}
      </PublicationMediaFrame>
    );
  }

  const canOpen = status === "ready" && Boolean(objectUrl);

  return (
    <PublicationMediaFrame
      variant="feed"
      kind="image"
      orientation={orientation}
      status={status}
      feedPublicationMarker={false}
      applyAspectRatio={false}
      className="publication-media-grid__tile overflow-hidden rounded-lg bg-neutral-50"
    >
      {canOpen ? (
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget.focus();
            openFeedMediaViewer({
              mediaUrl,
              objectUrl,
              // Le rang étant exact, l'entrée existe toujours ici ; le repli
              // ne porte donc PAS de numéro, qui serait faux s'il servait.
              label: viewerItems[viewerIndex]?.label ?? label,
              items: viewerItems,
              index: viewerIndex,
            });
          }}
          aria-label={`Agrandir l’image ${index + 1}`}
          className="absolute inset-0 block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yunicity-primary/50"
        >
          <AuthorizedPublicationImageView
            status={status}
            objectUrl={objectUrl}
            alt={label}
            framed
            onRetry={retry}
            onDisplayed={onDisplayed}
            onDecodeFailed={markDecodeFailed}
          />
          {showOverflow ? (
            <span className="publication-media-grid__overflow" aria-hidden>
              +{overflowCount}
            </span>
          ) : null}
        </button>
      ) : (
        <AuthorizedPublicationImageView
          status={status}
          objectUrl={objectUrl}
          alt={label}
          framed
          onRetry={retry}
          onDisplayed={onDisplayed}
          onDecodeFailed={markDecodeFailed}
        />
      )}
    </PublicationMediaFrame>
  );
}

export function FeedPublicationMedia({
  mediaUrl,
  mediaUrls,
  label,
}: {
  mediaUrl?: string | null;
  /** Liste ordonnée — si absente, `mediaUrl` seul. */
  mediaUrls?: string[] | null;
  label?: string;
}) {
  const alt = label?.trim() ? label.trim() : "Image de la publication";
  const fromList = (mediaUrls ?? []).map((u) => u.trim()).filter(Boolean);
  const urls = fromList.length > 0 ? fromList : mediaUrl?.trim() ? [mediaUrl.trim()] : [];

  if (urls.length === 0) return null;

  if (urls.length === 1) {
    const url = urls[0]!;
    if (isVideoMediaUrl(url)) {
      return <SinglePublicationVideo mediaUrl={url} />;
    }
    return <SinglePublicationImage mediaUrl={url} label={alt} />;
  }

  const { visible, overflowCount } = slicePublicationMediaForGrid(urls);

  /**
   * Le parcours de la visionneuse porte TOUTES les photos — y compris celles
   * que le plafond de quatre tuiles n'affiche pas. C'est ce qui les rend
   * atteignables sans toucher au plafond.
   *
   * ⛔ Les VIDÉOS en sont exclues : leur rendu passe par l'URL brute, hors
   * résolution autorisée, et cette limite reste documentée plutôt que
   * présentée comme fonctionnelle.
   */
  const photoUrls: string[] = [];
  /**
   * Rang PHOTO de chaque média, pris à sa POSITION dans la liste — jamais par
   * recherche de son URL : deux tuiles d'un même fichier partageraient alors
   * le même rang, et la seconde ouvrirait le parcours au mauvais endroit.
   * `-1` marque une vidéo, dont le rang n'est jamais lu (tuile sans bouton).
   */
  const photoRankAt: number[] = urls.map((url) => {
    if (isVideoMediaUrl(url)) return -1;
    photoUrls.push(url);
    return photoUrls.length - 1;
  });
  const viewerItems: FeedMediaViewerItem[] = photoUrls.map((url, rank) => ({
    mediaUrl: url,
    label: `${alt} (${rank + 1})`,
  }));

  return (
    <div
      data-feed-publication-media=""
      data-feed-publication-media-kind="grid"
      className="feed-publication-media mt-3"
    >
      <PublicationMediaGrid count={visible.length} overflowCount={overflowCount}>
        {visible.map((url, index) => (
          <MultiPublicationMediaTile
            key={`${url}:${index}`}
            mediaUrl={url}
            label={alt}
            index={index}
            viewerItems={viewerItems}
            viewerIndex={photoRankAt[index] ?? -1}
            showOverflow={overflowCount > 0 && index === visible.length - 1}
            overflowCount={overflowCount}
          />
        ))}
      </PublicationMediaGrid>
    </div>
  );
}
