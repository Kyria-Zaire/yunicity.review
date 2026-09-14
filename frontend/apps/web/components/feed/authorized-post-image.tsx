"use client";

import { AuthorizedPublicationImageView } from "@/components/feed/authorized-publication-image";
import { useAuthorizedMediaSource } from "@/hooks/use-authorized-media-source";

/**
 * Vignette / image de publication hors carte feed unifiée (profil, tribu, offre).
 * Même pipeline Bearer → Blob → décodage que le feed.
 */
export function AuthorizedPostImage({
  mediaUrl,
  alt = "",
  className = "",
  imgClassName = "",
}: {
  mediaUrl: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
}) {
  const image = useAuthorizedMediaSource(mediaUrl);
  return (
    <AuthorizedPublicationImageView
      status={image.status}
      objectUrl={image.objectUrl}
      alt={alt}
      className={className}
      imgClassName={imgClassName}
      onRetry={image.retry}
      onDisplayed={image.markDisplayed}
      onDecodeFailed={image.markDecodeFailed}
    />
  );
}
