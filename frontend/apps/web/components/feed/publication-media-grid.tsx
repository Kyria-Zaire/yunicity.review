"use client";

import type { ReactNode } from "react";

import {
  publicationMediaGridLayout,
  slicePublicationMediaForGrid,
} from "@yunicity/utils";

/**
 * Grille compacte multi-médias (MEDIA-02) — jamais une pile pleine hauteur.
 *
 * - 2 : paire équilibrée
 * - 3 : principale + deux secondaires
 * - 4 : 2×2
 * - 5+ : 4 premières tuiles + indicateur +N
 */

export function PublicationMediaGrid({
  count,
  overflowCount,
  children,
}: {
  count: number;
  overflowCount: number;
  children: ReactNode;
}) {
  const layout = publicationMediaGridLayout(count);
  return (
    <div
      data-publication-media-grid={layout}
      data-publication-media-overflow={overflowCount > 0 ? String(overflowCount) : undefined}
      className={`publication-media-grid publication-media-grid--${layout}`}
    >
      {children}
      {/*
        ⛔ PLUS AUCUN badge VISIBLE à ce niveau (MEDIA-MULTI-PHOTO-01).

        Il en existait un ici, enfant direct du conteneur — lui-même
        `position: relative` — portant `publication-media-grid__overflow`, soit
        `position: absolute; inset: 0` sur fond noir à 45 %. Il couvrait donc
        TOUTE la mosaïque d'un voile gris, et y centrait un « +N » pendant que
        la quatrième tuile affichait le sien : les DEUX défauts observés en
        recette, nés d'une seule cause. Le badge de la quatrième tuile demeure
        et suffit — il est posé DANS la tuile, donc il ne recouvre qu'elle.

        ⚠️ L'ANNONCE, elle, reste ici. Le badge de tuile est
        `<span aria-hidden>` : le retirer sans contrepartie priverait un
        lecteur d'écran de toute mention des médias non affichés. Cet élément
        n'a donc plus de surface — il ne porte que le texte.
      */}
      {overflowCount > 0 ? (
        <span
          data-publication-media-overflow-badge=""
          className="sr-only"
          aria-label={`${overflowCount} médias supplémentaires`}
        >
          {overflowCount} médias supplémentaires
        </span>
      ) : null}
    </div>
  );
}

export { slicePublicationMediaForGrid };
