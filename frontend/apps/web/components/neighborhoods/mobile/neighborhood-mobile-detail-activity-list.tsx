"use client";

import type { NeighborhoodMobileActivityItem } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_ACTIVITY_EMPTY,
  NEIGHBORHOOD_DETAIL_MOBILE_ACTIVITY_TITLE,
  NEIGHBORHOOD_DETAIL_MOBILE_ACTIVITY_VIEW_ALL,
} from "@yunicity/utils";
import { Heart } from "lucide-react";

type NeighborhoodMobileDetailActivityListProps = {
  items: NeighborhoodMobileActivityItem[];
};

/** Liste activité récente détail quartier mobile (MOBILE-QUARTIERS-02). */
export function NeighborhoodMobileDetailActivityList({ items }: NeighborhoodMobileDetailActivityListProps) {
  return (
    <section className="space-y-3" aria-label={NEIGHBORHOOD_DETAIL_MOBILE_ACTIVITY_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{NEIGHBORHOOD_DETAIL_MOBILE_ACTIVITY_TITLE}</h2>
        <button
          type="button"
          disabled
          title="Fil complet — bientôt disponible"
          className="text-sm font-semibold text-yunicity-primary opacity-60"
        >
          {NEIGHBORHOOD_DETAIL_MOBILE_ACTIVITY_VIEW_ALL} →
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          {NEIGHBORHOOD_DETAIL_MOBILE_ACTIVITY_EMPTY}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/80 bg-white">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 p-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary/10 text-sm font-bold text-yunicity-primary"
                aria-hidden
              >
                {item.authorLabel.trim().charAt(0).toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-800">
                  <span className="font-bold text-neutral-900">{item.authorLabel}</span>
                  {item.dateLabel ? (
                    <>
                      <span className="text-neutral-400"> · </span>
                      <span className="text-neutral-500">{item.dateLabel}</span>
                    </>
                  ) : null}
                </p>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-neutral-700">{item.body}</p>
              </div>
              <button
                type="button"
                disabled
                title="Réactions — bientôt disponible"
                className="inline-flex shrink-0 flex-col items-center gap-0.5 text-neutral-400 opacity-50"
                aria-hidden
              >
                <Heart className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
