"use client";

import { useExplorerOptional } from "@/components/explorer/explorer-provider";
import { FEED_PORTAL_FILTER } from "@yunicity/utils";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import type { MouseEvent } from "react";
import Link from "next/link";

type ProfileMediumChromeHeaderProps = {
  city: string;
};

/**
 * Barre chrome profil medium — 640 → 1023 px (alignée Feed / Sortir / Lieux).
 * Recherche → Explorer ; Filtrer → page recherche.
 */
export function ProfileMediumChromeHeader({ city }: ProfileMediumChromeHeaderProps) {
  const explorer = useExplorerOptional();

  return (
    <div className="profile-medium-chrome-header" data-profile-medium-chrome-header="">
      <span
        data-profile-medium-chrome-identity=""
        className="shrink-0 text-lg font-extrabold tracking-tight text-yunicity-primary"
      >
        Yunicity
      </span>

      <span
        data-profile-medium-chrome-city=""
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-neutral-700"
      >
        <MapPin className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
        <span className="whitespace-nowrap">
          <span className="sr-only">Ville courante : </span>
          {city}
        </span>
      </span>

      <button
        type="button"
        data-profile-medium-chrome-search=""
        onClick={(event: MouseEvent<HTMLButtonElement>) =>
          explorer?.openExplorer(event.currentTarget)
        }
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 text-left text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        <Search className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
        <span className="min-w-0 flex-1 truncate">Rechercher à {city}</span>
      </button>

      <Link
        href="/search"
        data-profile-medium-chrome-filter=""
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">{FEED_PORTAL_FILTER}</span>
      </Link>
    </div>
  );
}
