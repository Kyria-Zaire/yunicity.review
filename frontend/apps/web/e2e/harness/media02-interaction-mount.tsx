/**
 * MEDIA-02 — harnais d'interaction multi-médias et visionneuse.
 *
 * Monte les composants RÉELS : `FeedPublicationMedia` pour la grille, et
 * `FeedMediaViewerHost` pour la visionneuse partagée. Seuls le réseau autorisé
 * et la navigation sont bouchonnés.
 *
 * Les grilles vont jusqu'à 10 médias : c'est le cas que la revue exigeait et que
 * les tests unitaires ne couvraient pas.
 */

import { createRoot } from "react-dom/client";

import { FeedMediaViewerHost } from "@/components/feed/feed-media-viewer-host";
import { FeedPublicationMedia } from "@/components/feed/feed-publication-media";

const TAILLES = [1, 2, 3, 4, 5, 10] as const;

/** URLs autorisées distinctes et stables, une par média de chaque grille. */
function urls(taille: number): string[] {
  return Array.from({ length: taille }, (_, i) => {
    const a = `${taille}`.padStart(8, "0");
    const b = `${i + 1}`.padStart(8, "0");
    return `/api/v1/story-media/${a}-1111-4111-8111-111111111111/${b}-2222-4222-8222-222222222222.jpg`;
  });
}

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
            key={taille}
            data-media02-grid-card={String(taille)}
            className="feed-publication-padding border-b border-neutral-200 px-4 py-3"
          >
            <p className="text-xs text-neutral-500">{taille} média(s)</p>
            <div data-media02-grid-host={String(taille)}>
              <FeedPublicationMedia mediaUrls={urls(taille)} label={`Grille ${taille}`} />
            </div>
            <div data-media02-grid-actions={String(taille)} className="mt-3 h-11" />
          </article>
        ))}
      </div>
      <FeedMediaViewerHost />
    </div>,
  );

  window.media02InteractionPret = true;
}

mount();
