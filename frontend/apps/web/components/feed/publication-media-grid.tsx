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
      {overflowCount > 0 ? (
        <span
          data-publication-media-overflow-badge=""
          className="publication-media-grid__overflow"
          aria-label={`${overflowCount} médias supplémentaires`}
        >
          +{overflowCount}
        </span>
      ) : null}
    </div>
  );
}

export { slicePublicationMediaForGrid };
