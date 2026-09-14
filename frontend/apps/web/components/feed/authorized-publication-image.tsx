"use client";

import {
  AUTHORIZED_MEDIA_RETRY_LABEL,
  AUTHORIZED_MEDIA_UNAVAILABLE,
} from "@yunicity/utils";

import type { AuthorizedMediaStatus } from "@/hooks/use-authorized-media-source";

/**
 * États visuels d'une image de publication authentifiée (MEDIA-01B).
 * Vue pure — le chargement Bearer → Blob est porté par le hook parent.
 */
export function AuthorizedPublicationImageView({
  status,
  objectUrl,
  alt,
  className = "",
  imgClassName = "",
  onRetry,
}: {
  status: AuthorizedMediaStatus;
  objectUrl: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  onRetry: () => void;
}) {
  if (status === "loading" || status === "idle") {
    return (
      <div
        data-authorized-media-state="loading"
        className={`flex min-h-[12rem] w-full items-center justify-center bg-neutral-100 motion-safe:animate-pulse ${className}`}
        role="status"
        aria-label="Chargement de l’image"
      >
        <span className="sr-only">Chargement de l’image</span>
      </div>
    );
  }

  if (status === "error" || !objectUrl) {
    return (
      <div
        data-authorized-media-state="error"
        className={`flex min-h-[12rem] w-full flex-col items-center justify-center gap-3 bg-neutral-100 px-4 py-6 text-center ${className}`}
        role="alert"
      >
        <p className="text-sm text-neutral-700">{AUTHORIZED_MEDIA_UNAVAILABLE}</p>
        <button
          type="button"
          data-authorized-media-retry=""
          onClick={onRetry}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          {AUTHORIZED_MEDIA_RETRY_LABEL}
        </button>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob local authentifié, hors next/image
    <img
      data-authorized-media-state="ready"
      src={objectUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={imgClassName || className}
    />
  );
}
