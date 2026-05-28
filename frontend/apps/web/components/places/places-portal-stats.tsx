"use client";

import type { CulturalPlaceStatsResponse } from "@yunicity/types";
import { buildPlacesPortalStatCards, type PlacesPortalStatCard } from "@yunicity/utils";
import { Grid2x2, MapPin, Sparkles, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TONE_STYLES: Record<PlacesPortalStatCard["tone"], { wrap: string; icon: string }> = {
  blue: { wrap: "bg-sky-50 text-sky-700", icon: "text-sky-600" },
  green: { wrap: "bg-emerald-50 text-emerald-700", icon: "text-emerald-600" },
  orange: { wrap: "bg-amber-50 text-amber-800", icon: "text-amber-600" },
  purple: { wrap: "bg-violet-50 text-violet-800", icon: "text-violet-600" },
};

const ICONS: Record<string, LucideIcon> = {
  total: MapPin,
  new: Sparkles,
  reviews: Star,
  categories: Grid2x2,
};

type PlacesPortalStatsProps = {
  stats: CulturalPlaceStatsResponse | null;
};

export function PlacesPortalStats({ stats }: PlacesPortalStatsProps) {
  const cards = buildPlacesPortalStatCards(stats);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = ICONS[card.id] ?? MapPin;
        const tone = TONE_STYLES[card.tone];
        return (
          <article
            key={card.id}
            className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 shadow-sm"
          >
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.wrap}`}
            >
              <Icon className={`h-5 w-5 ${tone.icon}`} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-neutral-500">{card.label}</p>
              <p className="text-xl font-bold tabular-nums text-neutral-900">{card.value}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
