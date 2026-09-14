"use client";

import { AuthorizedPublicationImageView } from "@/components/feed/authorized-publication-image";
import { useAuthorizedMediaSource } from "@/hooks/use-authorized-media-source";
import { openFeedMediaViewer } from "@/lib/feed/feed-media-viewer-session";

/**
 * Média d'une publication — responsabilité UNIQUE (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A).
 *
 * Images (MEDIA-01B) : GET Bearer → Blob → décodage onLoad. Visionneuse : session
 * racine + compteur de références — survit au démontage de la carte.
 */

function isVideoMediaUrl(url: string): boolean {
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

export function FeedPublicationMedia({
  mediaUrl,
  label,
}: {
  mediaUrl: string;
  label?: string;
}) {
  const isVideo = isVideoMediaUrl(mediaUrl);
  const alt = label?.trim() ? label.trim() : "Image de la publication";
  const image = useAuthorizedMediaSource(isVideo ? null : mediaUrl);

  if (isVideo) {
    return (
      <div
        data-feed-publication-media=""
        data-feed-publication-media-kind="video"
        className="feed-publication-media relative mt-3 overflow-hidden rounded-xl border border-yunicity-border bg-neutral-900"
      >
        <video
          src={mediaUrl}
          className="max-h-80 w-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md">
            <IconPlay />
          </span>
        </div>
      </div>
    );
  }

  const canOpenViewer = image.status === "ready" && Boolean(image.objectUrl);

  return (
    <div
      data-feed-publication-media=""
      data-feed-publication-media-kind="image"
      className="feed-publication-media mt-3 overflow-hidden rounded-xl border border-yunicity-border bg-neutral-50"
    >
      {canOpenViewer ? (
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget.focus();
            openFeedMediaViewer({
              mediaUrl,
              objectUrl: image.objectUrl,
              label: alt,
            });
          }}
          aria-label="Agrandir l’image"
          className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yunicity-primary/50"
        >
          <AuthorizedPublicationImageView
            status={image.status}
            objectUrl={image.objectUrl}
            alt={alt}
            imgClassName="feed-publication-media-img mx-auto block w-full rounded-xl object-contain"
            onRetry={image.retry}
            onDisplayed={image.markDisplayed}
            onDecodeFailed={image.markDecodeFailed}
          />
        </button>
      ) : (
        <AuthorizedPublicationImageView
          status={image.status}
          objectUrl={image.objectUrl}
          alt={alt}
          imgClassName="feed-publication-media-img mx-auto block w-full rounded-xl object-contain"
          onRetry={image.retry}
          onDisplayed={image.markDisplayed}
          onDecodeFailed={image.markDecodeFailed}
        />
      )}
    </div>
  );
}
