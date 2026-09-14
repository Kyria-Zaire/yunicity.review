"use client";

import { Dialog } from "@yunicity/ui/primitives";

/**
 * Visionneuse média du fil mobile (C3.1-R1L, habillage C3.1-R1L.1).
 *
 * MEDIA-01B : reçoit l'object URL déjà chargée par la carte — pas de second
 * GET immédiat, pas de révocation tant que la carte détient encore la source.
 */
export function FeedMobileMediaViewer({
  open,
  onOpenChange,
  objectUrl,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Blob URL locale partagée avec la carte — jamais l'URL relative API. */
  objectUrl: string | null;
  /** Texte alternatif : le corps de la publication quand il existe. */
  label: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={label}
      closeLabel="Fermer l’image"
      chrome="bare"
      className="bg-black"
    >
      <div className="flex h-full w-full items-center justify-center">
        {objectUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob authentifié partagé
          <img
            src={objectUrl}
            alt={label}
            className="max-h-[100dvh] max-w-full object-contain"
            decoding="async"
          />
        ) : null}
      </div>
    </Dialog>
  );
}
