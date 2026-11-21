"use client";

import {
  AUTHORIZED_MEDIA_RETRY_LABEL,
  AUTHORIZED_MEDIA_UNAVAILABLE,
} from "@yunicity/utils";

import type { AuthorizedMediaStatus } from "@/hooks/use-authorized-media-source";

export type MediaIntrinsicSize = { width: number; height: number };

/**
 * États visuels d'une image de publication authentifiée (MEDIA-01B + MEDIA-02).
 *
 * Pendant `decoding`, l'`<img>` est présent pour déclencher le décodage mais
 * masqué (pas de pictogramme cassé). `ready` uniquement après `onLoad`.
 * Les dimensions intrinsèques sont reportées au parent pour le cadre adaptatif.
 */
export function AuthorizedPublicationImageView({
  status,
  objectUrl,
  alt,
  className = "",
  imgClassName = "",
  framed = false,
  onRetry,
  onDisplayed = () => undefined,
  onDecodeFailed = () => undefined,
}: {
  status: AuthorizedMediaStatus;
  objectUrl: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** true = remplit le PublicationMediaFrame (cover absolu). */
  framed?: boolean;
  onRetry: () => void;
  onDisplayed?: (size?: MediaIntrinsicSize) => void;
  onDecodeFailed?: () => void;
}) {
  const reportLoad = (img: HTMLImageElement) => {
    onDisplayed({ width: img.naturalWidth, height: img.naturalHeight });
  };

  if (status === "loading" || status === "idle") {
    return (
      <div
        data-authorized-media-state="loading"
        className={
          framed
            ? `flex h-full w-full items-center justify-center bg-neutral-100 motion-safe:animate-pulse ${className}`
            : `flex min-h-[12rem] w-full items-center justify-center bg-neutral-100 motion-safe:animate-pulse ${className}`
        }
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
        className={
          framed
            ? `flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-100 px-4 py-6 text-center ${className}`
            : `flex min-h-[12rem] w-full flex-col items-center justify-center gap-3 bg-neutral-100 px-4 py-6 text-center ${className}`
        }
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
        className={
          framed
            ? `relative flex h-full w-full items-center justify-center bg-neutral-100 motion-safe:animate-pulse ${className}`
            : `relative flex min-h-[12rem] w-full items-center justify-center bg-neutral-100 motion-safe:animate-pulse ${className}`
        }
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
          onLoad={(event) => reportLoad(event.currentTarget)}
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
        onLoad={(event) => reportLoad(event.currentTarget)}
        onError={onDecodeFailed}
        className={
          framed
            ? /*
               * Aucun `object-fit` ici : il appartient au CADRE, qui le tient du
               * contrat partage (`feedObjectFitForKind`) et l'expose en
               * `data-publication-media-fit`. Le CSS applique cette valeur a
               * `.publication-media-frame__media`.
               *
               * Cette classe portait `object-cover` en dur pendant que l'attribut
               * du cadre pouvait annoncer autre chose : les deux ont diverge sans
               * que rien ne le signale. Une image ne decide pas de son recadrage ;
               * le cadre le decide pour elle.
               */
              `publication-media-frame__media h-full w-full ${imgClassName || className}`
            : imgClassName || className
        }
      />
    );
  }

  return null;
}
