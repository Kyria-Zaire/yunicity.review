"use client";

import Link from "next/link";
import { INTEREST_LABELS } from "@yunicity/utils";
import { Sheet } from "@yunicity/ui/primitives";
import type { RefObject } from "react";

import {
  FEED_MEDIUM_FILTER_CLOSE_LABEL,
  FEED_MEDIUM_FILTER_CRITERION_IDS,
  FEED_MEDIUM_FILTER_CRITERION_LABELS,
  FEED_MEDIUM_FILTER_PANEL_TITLE,
  FEED_MEDIUM_FILTER_RESET_LABEL,
  isFeedMediumInterestFilterActive,
} from "@/lib/layout/feed-medium-filter-contract";
import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";

/**
 * Surface de filtrage medium (C3-FEED-M10).
 *
 * Une seule dimension réelle : activer/désactiver le filtrage client selon les
 * centres d'intérêt du profil. Application IMMÉDIATE à l'ouverture (contrat
 * historique) ; Fermer ne désactive pas ; Réinitialiser restaure le fil.
 */
export function FeedMediumFilterSheet({
  open,
  onOpenChange,
  activated,
  interests,
  onReset,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activated: boolean;
  interests: readonly string[];
  onReset: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const active = isFeedMediumInterestFilterActive({ activated, interests });
  const criterionId = FEED_MEDIUM_FILTER_CRITERION_IDS[0];

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={FEED_MEDIUM_FILTER_PANEL_TITLE}
      closeLabel={FEED_MEDIUM_FILTER_CLOSE_LABEL}
      returnFocusRef={returnFocusRef}
      zIndex={NAVIGATION_MODAL_Z_INDEX}
      className="feed-medium-filter-sheet max-w-md"
    >
      <div data-feed-medium-filter-panel="" className="flex flex-col gap-6">
        <section
          data-feed-medium-filter-criterion={criterionId}
          aria-labelledby="feed-medium-filter-criterion-title"
        >
          <h3
            id="feed-medium-filter-criterion-title"
            className="text-sm font-bold text-neutral-900"
          >
            {FEED_MEDIUM_FILTER_CRITERION_LABELS[criterionId]}
          </h3>
          <p className="mt-2 text-sm text-neutral-600">
            Lorsque le filtre est actif, le fil « Pour vous » ne conserve que les
            publications qui correspondent à vos centres d&apos;intérêt. Aucun
            autre critère n&apos;est disponible.
          </p>

          {interests.length > 0 ? (
            <ul className="mt-4 divide-y divide-neutral-100 border-y border-neutral-100">
              {interests.map((interest) => (
                <li
                  key={interest}
                  data-feed-medium-filter-interest={interest}
                  className="flex min-h-11 items-center py-2 text-sm font-medium text-neutral-800"
                >
                  {INTEREST_LABELS[interest] ?? interest}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-neutral-600">
              Ajoutez vos centres d&apos;intérêt dans les{" "}
              <Link
                href="/settings"
                className="font-semibold text-yunicity-primary hover:underline"
                onClick={() => onOpenChange(false)}
              >
                paramètres
              </Link>{" "}
              pour activer le filtrage.
            </p>
          )}

          <p
            data-feed-medium-filter-status=""
            className="mt-3 text-sm font-semibold text-neutral-900"
            role="status"
          >
            {active
              ? "Filtre actif"
              : interests.length > 0
                ? "Filtre prêt — appliqué sur « Pour vous »"
                : "Filtre indisponible sans centres d'intérêt"}
          </p>

          <p className="mt-2 text-xs text-neutral-500">
            La publication vidéo locale du fil n&apos;est pas scorée par centre
            d&apos;intérêt : elle conserve sa place éditoriale dans « Pour vous »
            indépendamment de ce filtre.
          </p>
        </section>

        <div className="flex flex-col gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            data-feed-medium-filter-reset=""
            disabled={!activated}
            onClick={onReset}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-neutral-200 px-4 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
          >
            {FEED_MEDIUM_FILTER_RESET_LABEL}
          </button>
          <button
            type="button"
            data-feed-medium-filter-close=""
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
          >
            {FEED_MEDIUM_FILTER_CLOSE_LABEL}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
