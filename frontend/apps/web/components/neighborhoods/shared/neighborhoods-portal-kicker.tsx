"use client";

import { NEIGHBORHOODS_DESKTOP_KICKER } from "@yunicity/utils";

type NeighborhoodsPortalKickerProps = {
  city: string;
  count: number;
  loading?: boolean;
  className?: string;
};

/**
 * Kicker portail quartiers — masque la valeur pendant le chargement pour éviter « 0 QUARTIER ».
 */
export function NeighborhoodsPortalKicker({
  city,
  count,
  loading = false,
  className = "text-xs font-bold uppercase tracking-[0.14em] text-yunicity-primary",
}: NeighborhoodsPortalKickerProps) {
  if (loading) {
    return (
      <p className={className} data-neighborhoods-portal-kicker="" data-loading="">
        <span
          className="inline-block h-3.5 w-[9.5rem] max-w-full animate-pulse rounded bg-yunicity-primary/15"
          aria-hidden
        />
        <span className="sr-only">Chargement du nombre de quartiers</span>
      </p>
    );
  }

  return (
    <p className={className} data-neighborhoods-portal-kicker="">
      {NEIGHBORHOODS_DESKTOP_KICKER(city, count)}
    </p>
  );
}
