/**
 * Secteurs officiels de Reims — 12 conseils de quartier regroupant 31 anciens quartiers.
 *
 * QUARTIER-01 phase 3c a fusionne cernay, jean-jaures et boulingrin dans cernay-jean-jaures.
 * Le catalogue backend les desactive (is_active=false) et next.config les redirige en 301, mais
 * un environnement dont la base n'a pas rejoue le seed catalog les renvoie encore ACTIFS : la
 * liste passe alors a 15, et une page tronquee affiche 3 secteurs fusionnes a la place de 3
 * secteurs reels. Cette exclusion explicite rend le rendu independant de l'etat du seed.
 *
 * Miroir de `REIMS_MERGED_NEIGHBORHOOD_SLUGS` (backend catalog + next.config redirects).
 */
export const REIMS_MERGED_NEIGHBORHOOD_SLUGS = ["cernay", "jean-jaures", "boulingrin"] as const;

export function isMergedNeighborhoodSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  return (REIMS_MERGED_NEIGHBORHOOD_SLUGS as readonly string[]).includes(normalized);
}

/** Ne garde que les secteurs officiels : actifs ET non fusionnes. */
export function keepOfficialSectors<T extends { slug: string; is_active?: boolean }>(
  neighborhoods: T[],
): T[] {
  return neighborhoods.filter(
    (hood) => hood.is_active !== false && !isMergedNeighborhoodSlug(hood.slug),
  );
}
