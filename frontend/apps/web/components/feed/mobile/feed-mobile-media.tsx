"use client";

import { useState } from "react";

import { FeedMobileMediaViewer } from "@/components/feed/mobile/feed-mobile-media-viewer";
import { FEED_MOBILE_MEDIA_BLEED_CLASS } from "@/lib/layout/feed-mobile-full-bleed";

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

/**
 * Média feed mobile — image ou vidéo avec overlay lecture (MOBILE-REFONDE-01).
 *
 * C3.1-R1L : l'image est désormais un déclencheur de visionneuse. La vidéo reste
 * inchangée — son lecteur appartient à sa propre feature, hors périmètre ici.
 */
export function FeedMobileMedia({ mediaUrl, label }: { mediaUrl: string; label?: string }) {
  const isVideo = isVideoMediaUrl(mediaUrl);
  const [viewerOpen, setViewerOpen] = useState(false);
  const alt = label?.trim() ? label.trim() : "Image de la publication";

  if (isVideo) {
    return (
      <div
        className={`relative ${FEED_MOBILE_MEDIA_BLEED_CLASS} mt-3 overflow-hidden bg-neutral-900`}
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

  return (
    <>
      {/* Le conteneur porte le bord a bord (`-mx-4`) exactement comme avant
          C3.1-R1L : un <button> est en shrink-to-fit meme en `display:block`, il
          ne peut donc pas porter cette classe (mesure : 175 px au lieu de 390).
          Le declencheur est place A L'INTERIEUR et remplit la largeur. */}
      <div className={`${FEED_MOBILE_MEDIA_BLEED_CLASS} mt-3 overflow-hidden bg-neutral-50`}>
        <button
          type="button"
          onClick={(event) => {
            // WebKit ne donne pas le focus a un bouton au clic (comportement
            // Safari) : sans cela, l'overlay memorise `body` comme point de
            // retour et le focus n'y revient pas a la fermeture. On l'ancre
            // explicitement sur le declencheur, identique sur tous les moteurs.
            event.currentTarget.focus();
            setViewerOpen(true);
          }}
          aria-label="Agrandir l’image"
          className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-yunicity-primary/50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="mx-auto block max-h-[min(80vw,480px)] w-full object-contain"
          />
        </button>
      </div>
      <FeedMobileMediaViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        mediaUrl={mediaUrl}
        label={alt}
      />
    </>
  );
}
