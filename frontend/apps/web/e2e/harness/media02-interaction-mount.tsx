/**
 * MEDIA-02 — harnais d'interaction multi-médias et visionneuse.
 *
 * Monte les composants RÉELS : `FeedPublicationMedia` pour la grille, et
 * `FeedMediaViewerHost` pour la visionneuse partagée. Seuls le réseau autorisé
 * et la navigation sont bouchonnés.
 *
 * Les lots vont jusqu'à 10 médias : c'est le cas que la revue exigeait et que
 * les tests unitaires ne couvraient pas.
 *
 * ## DEUX familles d'hôtes depuis MEDIA-MULTI-PHOTO-01
 *
 * `FeedPublicationMedia` choisit son rendu d'après le CONTENU du lot :
 *
 * - **lot de photos seules** → CARROUSEL. Monté sous
 *   `data-media02-carousel-host`, éprouvé par
 *   `media02-carousel-interaction-accessibility.spec.ts` ;
 * - **lot MIXTE photo + vidéo** → MOSAÏQUE, inchangée. Montée sous
 *   `data-media02-grid-host`, éprouvée par
 *   `media02-interaction-accessibility.spec.ts`.
 *
 * ⚠️ Les deux familles sont nécessaires. N'en garder qu'une laisserait l'autre
 * rendu sans aucune preuve en navigateur, alors que les deux sont en
 * production.
 */

import { createRoot } from "react-dom/client";

import { FeedMediaViewerHost } from "@/components/feed/feed-media-viewer-host";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";

const TAILLES = [1, 2, 3, 4, 5, 10] as const;

/** URLs autorisées distinctes et stables, une par média de chaque lot. */
function urls(taille: number, famille: string, extensionDerniere = "jpg"): string[] {
  return Array.from({ length: taille }, (_, i) => {
    const a = `${famille}${taille}`.padStart(8, "0");
    const b = `${i + 1}`.padStart(8, "0");
    const ext = i === taille - 1 ? extensionDerniere : "jpg";
    return `/api/v1/story-media/${a}-1111-4111-8111-111111111111/${b}-2222-4222-8222-222222222222.${ext}`;
  });
}

/** Lot PHOTOS SEULES — rendu par le carrousel. */
const photos = (taille: number) => urls(taille, "c");

/**
 * Lot MIXTE — rendu par la mosaïque. La VIDÉO est en DERNIÈRE position :
 * les quatre premières tuiles restent donc des photos, et les assertions de
 * disposition, d'ordre et de débordement de MEDIA-02 gardent leur sens.
 */
const mixte = (taille: number) => urls(taille, "g", "mp4");

declare global {
  interface Window {
    media02InteractionPret: boolean;
  }
}

function mount(): void {
  const root = document.getElementById("media02-root");
  if (!root) throw new Error("media02-root manquant");

  createRoot(root).render(
    <div className="citizen-feed-shell feed-mobile-shell mx-auto max-w-lg bg-[#F4F5F7]">
      <div className="feed-main-column mx-auto max-w-[28rem] bg-white pb-24">
        {TAILLES.map((taille) => (
          <article
            key={`grille-${taille}`}
            data-media02-grid-card={String(taille)}
            className="feed-publication-padding border-b border-neutral-200 px-4 py-3"
          >
            <p className="text-xs text-neutral-500">{taille} média(s) — lot mixte</p>
            <div data-media02-grid-host={String(taille)}>
              <FeedPublicationMedia mediaUrls={mixte(taille)} label={`Grille ${taille}`} />
            </div>
            <div data-media02-grid-actions={String(taille)} className="mt-3 h-11" />
          </article>
        ))}
        {TAILLES.map((taille) => (
          <article
            key={`carrousel-${taille}`}
            data-media02-carousel-card={String(taille)}
            className="feed-publication-padding border-b border-neutral-200 px-4 py-3"
          >
            <p className="text-xs text-neutral-500">{taille} photo(s) — lot de photos</p>
            <div data-media02-carousel-host={String(taille)}>
              <FeedPublicationMedia mediaUrls={photos(taille)} label={`Grille ${taille}`} />
            </div>
          </article>
        ))}
      </div>
      <FeedMediaViewerHost />
    </div>,
  );

  window.media02InteractionPret = true;
}

mount();
