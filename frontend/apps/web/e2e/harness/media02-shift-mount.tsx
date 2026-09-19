/**
 * MEDIA-02 — harnais de mesure du saut de mise en page.
 *
 * Le harnais principal fixe `orientation` en dur : il ne dit donc rien de la
 * transition « dimensions inconnues → dimensions mesurées », seul moment où le
 * cadre peut changer de hauteur.
 *
 * On mesure ici ce qui détermine réellement ce saut : la hauteur du cadre avant
 * mesure (`orientation={null}`, l'état affiché pendant le chargement) et sa
 * hauteur une fois l'orientation connue, dans le MÊME conteneur et avec le CSS
 * réel. Passer par le pipeline blob ne changerait pas ces hauteurs — il décide
 * seulement de l'instant du basculement.
 */

import { createRoot } from "react-dom/client";

import { PublicationMediaFrame } from "@/components/feed/publication-media-frame";
import { classifyMediaOrientation, type MediaOrientation } from "@yunicity/utils";

type CasMesure = {
  cle: string;
  largeur: number;
  hauteur: number;
  orientation: MediaOrientation;
};

const BRUTS: Array<Omit<CasMesure, "orientation">> = [
  { cle: "portrait-9-16", largeur: 1080, hauteur: 1920 },
  { cle: "portrait-3-4", largeur: 1200, hauteur: 1600 },
  { cle: "carre-1-1", largeur: 1200, hauteur: 1200 },
  { cle: "paysage-4-3", largeur: 1600, hauteur: 1200 },
  { cle: "paysage-16-9", largeur: 1920, hauteur: 1080 },
  { cle: "ultra-large-21-9", largeur: 2520, hauteur: 1080 },
];

// L'orientation vient de la MÊME primitive que la production : si elle change,
// la mesure change avec elle.
const CAS: CasMesure[] = BRUTS.map((c) => {
  const orientation = classifyMediaOrientation(c.largeur, c.hauteur);
  if (!orientation) throw new Error(`orientation indeterminee pour ${c.cle}`);
  return { ...c, orientation };
});

declare global {
  interface Window {
    media02Cas: CasMesure[];
    media02Pret: boolean;
  }
}

function Carte({ cas }: { cas: CasMesure }) {
  return (
    <article
      data-media02-shift-card={cas.cle}
      className="feed-publication-padding border-b border-neutral-200 px-4 py-3"
    >
      <p className="text-xs text-neutral-500">{cas.cle}</p>
      {/* Avant mesure : ce que l'utilisateur voit pendant le chargement. */}
      <div data-media02-shift-loading={cas.cle} className="mt-3">
        <PublicationMediaFrame variant="feed" kind="image" orientation={null} status="loading">
          <div className="publication-media-frame__media bg-neutral-200" />
        </PublicationMediaFrame>
      </div>
      {/* Après mesure : le cadre définitif. */}
      <div data-media02-shift-ready={cas.cle} className="mt-3">
        <PublicationMediaFrame
          variant="feed"
          kind="image"
          orientation={cas.orientation}
          status="ready"
        >
          <div className="publication-media-frame__media bg-neutral-400" />
        </PublicationMediaFrame>
      </div>
      <div data-media02-shift-actions={cas.cle} className="mt-3 h-11" />
    </article>
  );
}

function mount(): void {
  const root = document.getElementById("media02-root");
  if (!root) throw new Error("media02-root manquant");

  window.media02Cas = CAS;
  createRoot(root).render(
    <div className="citizen-feed-shell feed-mobile-shell mx-auto max-w-lg bg-[#F4F5F7]">
      <div className="feed-main-column mx-auto max-w-[28rem] bg-white pb-24">
        {CAS.map((cas) => (
          <Carte key={cas.cle} cas={cas} />
        ))}
      </div>
    </div>,
  );
  window.media02Pret = true;
}

mount();
