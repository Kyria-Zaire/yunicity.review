"use client";

import type { CSSProperties, ReactNode } from "react";

import {
  defaultFeedOrientation,
  feedAspectRatioForOrientation,
  feedObjectFitForKind,
  type MediaOrientation,
  type PublicationMediaFrameVariant,
} from "@yunicity/utils";

/**
 * Cadre canonique des médias de publication (MEDIA-02).
 *
 * Une seule source de vérité pour ratio, plafond de hauteur et object-fit.
 * Les cartes feed / composer / viewer ne doivent plus inventer leurs propres
 * max-height / aspect-ratio / object-fit.
 */

export type PublicationMediaFrameProps = {
  variant: PublicationMediaFrameVariant;
  kind: "image" | "video";
  /** null = dimensions pas encore connues → défaut feed portrait. */
  orientation: MediaOrientation | null;
  status?: "loading" | "decoding" | "ready" | "error" | "idle";
  children: ReactNode;
  className?: string;
  /** false = n'émet pas data-feed-publication-media (tuiles de grille). */
  feedPublicationMarker?: boolean;
  feedPublicationKind?: string;
  /** false = la grille parent impose la boîte (pas d'aspect-ratio propre). */
  applyAspectRatio?: boolean;
};

function resolveOrientation(
  variant: PublicationMediaFrameVariant,
  orientation: MediaOrientation | null,
): MediaOrientation {
  if (orientation) return orientation;
  if (variant === "viewer" || variant === "thumbnail") return "landscape";
  return defaultFeedOrientation();
}

export function PublicationMediaFrame({
  variant,
  kind,
  orientation,
  status,
  children,
  className = "",
  feedPublicationMarker = true,
  feedPublicationKind,
  applyAspectRatio = true,
}: PublicationMediaFrameProps) {
  const resolved = resolveOrientation(variant, orientation);
  const objectFit = feedObjectFitForKind(kind);

  const style: CSSProperties =
    variant === "viewer"
      ? {
          width: "100%",
          height: "100%",
          maxHeight: "100dvh",
        }
      : variant === "thumbnail"
        ? {
            width: "100%",
            height: "100%",
          }
        : applyAspectRatio
          ? {
              aspectRatio: feedAspectRatioForOrientation(resolved),
            }
          : {
              width: "100%",
              height: "100%",
            };

  return (
    <div
      data-publication-media-frame={variant}
      data-publication-media-orientation={resolved}
      data-publication-media-kind={kind}
      data-publication-media-fit={variant === "viewer" ? "contain" : objectFit}
      data-publication-media-status={status ?? undefined}
      {...(feedPublicationMarker
        ? {
            "data-feed-publication-media": "",
            "data-feed-publication-media-kind": feedPublicationKind ?? kind,
          }
        : {})}
      className={`publication-media-frame publication-media-frame--${variant} ${className}`.trim()}
      style={style}
    >
      <div
        className={
          variant === "viewer"
            ? "publication-media-frame__surface publication-media-frame__surface--viewer"
            : "publication-media-frame__surface"
        }
      >
        {children}
      </div>
    </div>
  );
}
