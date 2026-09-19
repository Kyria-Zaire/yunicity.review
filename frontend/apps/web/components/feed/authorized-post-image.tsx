"use client";

import { useCallback, useState } from "react";

import {
  AuthorizedPublicationImageView,
  type MediaIntrinsicSize,
} from "@/components/feed/authorized-publication-image";
import { PublicationMediaFrame } from "@/components/feed/publication-media-frame";
import { useAuthorizedMediaSource } from "@/hooks/use-authorized-media-source";
import {
  classifyMediaOrientation,
  isThumbnailVariant,
  type MediaOrientation,
  type PublicationMediaFrameVariant,
} from "@yunicity/utils";

/**
 * Image de publication hors carte feed unifiée : profil, tribu, offre.
 *
 * Même pipeline Bearer → Blob → décodage que le feed (MEDIA-01B/01C), et
 * désormais **même cadre canonique** (MEDIA-02) : ces surfaces ne définissent
 * plus leur propre `max-h` ni leur propre ratio. Elles choisissent seulement
 * une variante — `compact` pour une publication secondaire, `thumbnail` pour
 * une vraie vignette bornée.
 */
export function AuthorizedPostImage({
  mediaUrl,
  alt = "",
  className = "",
  imgClassName = "",
  variant = "compact",
}: {
  mediaUrl: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  variant?: Extract<PublicationMediaFrameVariant, "compact" | "thumbnail" | "feed">;
}) {
  const image = useAuthorizedMediaSource(mediaUrl);
  const [orientation, setOrientation] = useState<MediaOrientation | null>(null);

  const onDisplayed = useCallback(
    (size?: MediaIntrinsicSize) => {
      // Une vignette est carrée par contrat : mesurer son orientation ne
      // changerait rien et introduirait un cadre adaptatif là où on n'en veut pas.
      if (size && !isThumbnailVariant(variant)) {
        const next = classifyMediaOrientation(size.width, size.height);
        if (next) setOrientation(next);
      }
      image.markDisplayed();
    },
    [image, variant],
  );

  return (
    <PublicationMediaFrame
      variant={variant}
      kind="image"
      orientation={orientation}
      status={image.status}
      feedPublicationMarker={false}
      className={className}
    >
      <AuthorizedPublicationImageView
        status={image.status}
        objectUrl={image.objectUrl}
        alt={alt}
        framed
        imgClassName={imgClassName}
        onRetry={image.retry}
        onDisplayed={onDisplayed}
        onDecodeFailed={image.markDecodeFailed}
      />
    </PublicationMediaFrame>
  );
}
