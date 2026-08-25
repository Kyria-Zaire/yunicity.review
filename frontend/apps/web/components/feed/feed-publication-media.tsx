"use client";

import { useState } from "react";

import { FeedMobileMediaViewer } from "@/components/feed/mobile/feed-mobile-media-viewer";

/**
 * Média d'une publication — responsabilité UNIQUE (C3-FEED-UNIFIED-PUBLICATION-CARD-R2A).
 *
 * ── Ce que ce composant remplace ─────────────────────────────────────────────
 * La carte bifurquait : `FeedMobileMedia` en mobile (image cliquable +
 * visionneuse + vidéo avec overlay de lecture), et un `<img>` nu partout
 * ailleurs. Ce `<img>` recevait aussi les `media_url` de VIDÉO — il affichait
 * donc une image cassée sur desktop et medium, sans visionneuse. Le défaut est
 * fermé ici : une seule responsabilité, tous les écrans.
 *
 * ── Ce qui est conservé à l'identique ────────────────────────────────────────
 * Détection vidéo, `muted` + `playsInline` + `preload="metadata"` (aucun
 * autoplay sonore, aucune lecture spontanée), overlay de lecture, visionneuse
 * `FeedMobileMediaViewer`, `alt` dérivé du corps, ancrage explicite du focus au
 * clic pour que WebKit restitue le focus au déclencheur à la fermeture.
 *
 * ── Ce qui varie par bande ───────────────────────────────────────────────────
 * Uniquement le bord à bord et la hauteur, portés par `.feed-publication-media`
 * dans `globals.css`. Aucune identité, aucun contrôle, aucun `alt` ne dépend de
 * la largeur.
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
  const [viewerOpen, setViewerOpen] = useState(false);
  const alt = label?.trim() ? label.trim() : "Image de la publication";

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

  return (
    <>
      {/* Le conteneur porte le bord a bord : un <button> reste en shrink-to-fit
          meme en `display:block` et ne peut donc pas le porter (mesure C3.1-R1L :
          175 px au lieu de 390). Le declencheur est A L'INTERIEUR, pleine largeur. */}
      <div
        data-feed-publication-media=""
        data-feed-publication-media-kind="image"
        className="feed-publication-media mt-3 overflow-hidden rounded-xl border border-yunicity-border bg-neutral-50"
      >
        <button
          type="button"
          onClick={(event) => {
            // WebKit ne donne pas le focus a un bouton au clic : sans cet ancrage
            // explicite, la visionneuse memorise `body` et le focus n'est pas
            // rendu au declencheur a la fermeture.
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
            className="feed-publication-media-img mx-auto block w-full rounded-xl object-contain"
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
