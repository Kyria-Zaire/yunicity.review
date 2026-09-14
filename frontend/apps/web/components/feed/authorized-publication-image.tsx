"use client";

import {
  AUTHORIZED_MEDIA_RETRY_LABEL,
  AUTHORIZED_MEDIA_UNAVAILABLE,
} from "@yunicity/utils";

import type { AuthorizedMediaStatus } from "@/hooks/use-authorized-media-source";

/**
 * États visuels d'une image de publication authentifiée (MEDIA-01B).
 *
 * Pendant `decoding`, l'`<img>` est présent pour déclencher le décodage mais
 * masqué (pas de pictogramme cassé). `ready` uniquement après `onLoad`.
 */
export function AuthorizedPublicationImageView({
  status,
  objectUrl,
  alt,
  className = "",
  imgClassName = "",
  onRetry,
  onDisplayed = () => undefined,
  onDecodeFailed = () => undefined,
}: {
  status: AuthorizedMediaStatus;
  objectUrl: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  onRetry: () => void;
  onDisplayed?: () => void;
  onDecodeFailed?: () => void;
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

  if (status === "error" || (!objectUrl && status !== "decoding")) {
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

  if (status === "decoding" && objectUrl) {
    return (
      <div
        data-authorized-media-state="decoding"
        className={`relative flex min-h-[12rem] w-full items-center justify-center bg-neutral-100 motion-safe:animate-pulse ${className}`}
        role="status"
        aria-label="Décodage de l’image"
      >
        <span className="sr-only">Décodage de l’image</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={objectUrl}
          alt=""
          aria-hidden
          decoding="async"
          onLoad={onDisplayed}
          onError={onDecodeFailed}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      </div>
    );
  }

  if (status === "ready" && objectUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- blob local authentifié
      <img
        data-authorized-media-state="ready"
        src={objectUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={onDecodeFailed}
        className={imgClassName || className}
      />
    );
  }

  return null;
}
