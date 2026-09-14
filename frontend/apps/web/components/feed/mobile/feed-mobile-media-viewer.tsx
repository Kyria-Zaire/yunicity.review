"use client";

import { useEffect } from "react";

import { Dialog } from "@yunicity/ui/primitives";
import { useAuthorizedMediaSource } from "@/hooks/use-authorized-media-source";
import { AuthorizedPublicationImageView } from "@/components/feed/authorized-publication-image";
import { PublicationMediaFrame } from "@/components/feed/publication-media-frame";
import { releaseAuthorizedObjectUrl, retainAuthorizedObjectUrl } from "@yunicity/utils";

/**
 * Visionneuse média du fil (C3.1-R1L + MEDIA-01B + MEDIA-02).
 *
 * Préfère l'object URL partagée par la carte. Si elle disparaît (démontage carte
 * / révocation) alors que le dialogue est ouvert, second fetch authentifié.
 * Viewer = contain, original complet, distinct du cadre feed cover.
 */
export function FeedMobileMediaViewer({
  open,
  onOpenChange,
  objectUrl,
  mediaUrl,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectUrl: string | null;
  /** URL distante pour repli si la source partagée n'est plus disponible. */
  mediaUrl: string;
  label: string;
}) {
  const needsFallback = open && !objectUrl;
  const fallback = useAuthorizedMediaSource(needsFallback ? mediaUrl : null);
  const activeUrl = objectUrl ?? fallback.objectUrl;

  useEffect(() => {
    if (!open || !activeUrl) return;
    retainAuthorizedObjectUrl(activeUrl);
    return () => releaseAuthorizedObjectUrl(activeUrl);
  }, [open, activeUrl]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={label}
      closeLabel="Fermer l’image"
      chrome="bare"
      className="bg-black"
    >
      <div
        className="flex h-full w-full items-center justify-center px-[max(0.5rem,env(safe-area-inset-left))] py-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <PublicationMediaFrame
          variant="viewer"
          kind="image"
          orientation={null}
          feedPublicationMarker={false}
          className="flex max-h-[100dvh] max-w-full items-center justify-center"
        >
          {objectUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL déjà décodée par la carte
            <img
              data-authorized-media-state="ready"
              src={objectUrl}
              alt={label}
              className="publication-media-frame__media max-h-[100dvh] max-w-full object-contain"
              decoding="async"
            />
          ) : (
            <AuthorizedPublicationImageView
              status={fallback.status === "idle" && needsFallback ? "loading" : fallback.status}
              objectUrl={fallback.objectUrl}
              alt={label}
              imgClassName="publication-media-frame__media max-h-[100dvh] max-w-full object-contain"
              onRetry={fallback.retry}
              onDisplayed={fallback.markDisplayed}
              onDecodeFailed={fallback.markDecodeFailed}
            />
          )}
        </PublicationMediaFrame>
      </div>
    </Dialog>
  );
}
