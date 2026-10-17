"use client";

import { SEARCH_DESKTOP_EMPTY_HINT_BODY, SEARCH_DESKTOP_EMPTY_HINT_TITLE } from "@yunicity/utils";

/** État initial — page Recherche globale sans requête (maquette SEARCH-DESKTOP-01). */
export function SearchDesktopGlobalEmptyState() {
  return (
    <section
      className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-6 py-10 text-center"
      data-search-desktop-empty=""
    >
      <p className="text-base font-semibold text-neutral-900">{SEARCH_DESKTOP_EMPTY_HINT_TITLE}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
        {SEARCH_DESKTOP_EMPTY_HINT_BODY}
      </p>
    </section>
  );
}
