"use client";

import type { PassportLevelView } from "@yunicity/utils";
import {
  PASSPORT_HERO_LEVEL_LABEL,
  PASSPORT_HERO_NEXT_PREFIX,
  PASSPORT_HERO_POINTS_HINT,
  PASSPORT_HERO_POINTS_TITLE,
  formatPassportPoints,
} from "@yunicity/utils";
import { ChevronRight, Sparkles } from "lucide-react";

const HERO_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Reims_Cathedral_-_west_facade_%28by_Pudelek%29.jpg/1280px-Reims_Cathedral_-_west_facade_%28by_Pudelek%29.jpg";

type PassportDashboardHeroProps = {
  levelView: PassportLevelView;
  displayName: string;
  /** Points de réputation tels que l'API les renvoie — indépendants de toute échelle de niveau. */
  reputationPoints: number;
  /** `progression.points_to_next` de l'API, ou `null`. */
  pointsToNext: number | null;
  onScrollProgression: () => void;
};

export function PassportDashboardHero({
  levelView,
  displayName,
  reputationPoints,
  pointsToNext,
  onScrollProgression,
}: PassportDashboardHeroProps) {
  // PASSPORT-LEVEL-SCALE-01 : composant orphelin (non monté). Le niveau suit le tier ;
  // l'échelle à cinq paliers (description de palier, barre) est retirée. Les points de
  // réputation et « N pts restants », données API indépendantes de l'échelle, sont conservés.
  const { currentLabel, nextLabel } = levelView;

  return (
    <section
      id="passport-overview"
      className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-lg"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-neutral-950/80" aria-hidden />

      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_minmax(220px,280px)] lg:items-end">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-yunicity-primary-soft">
            <Sparkles className="h-5 w-5 text-[#A5B4FC]" aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C7D2FE]">
              {PASSPORT_HERO_LEVEL_LABEL}
            </p>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{currentLabel}</h1>
          <p className="mt-1 text-sm text-neutral-300">{displayName}</p>

          <div className="mt-6 max-w-md">
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
              <span>{formatPassportPoints(reputationPoints)}</span>
              {nextLabel ? (
                <span>{pointsToNext != null ? `${pointsToNext} pts restants` : PASSPORT_HERO_NEXT_PREFIX}</span>
              ) : null}
            </div>
            {nextLabel ? (
              <button
                type="button"
                onClick={onScrollProgression}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#C7D2FE] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
              >
                {PASSPORT_HERO_NEXT_PREFIX} {nextLabel}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-900/95 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {PASSPORT_HERO_POINTS_TITLE}
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums">{formatPassportPoints(reputationPoints)}</p>
          <p className="mt-3 text-xs leading-relaxed text-neutral-400">{PASSPORT_HERO_POINTS_HINT}</p>
        </div>
      </div>
    </section>
  );
}
