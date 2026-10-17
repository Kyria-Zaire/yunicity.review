"use client";

import type { Neighborhood } from "@yunicity/types";
import {
  MAP_RAIL_NEIGHBORHOOD_AMBIANCE_TITLE,
  neighborhoodAmbianceBadge,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type MapDesktopNeighborhoodAmbianceListProps = {
  city: string;
  neighborhoods: Neighborhood[];
};

const AMBIANCE_ICON_COLORS: Record<string, string> = {
  cultural: "bg-violet-100 text-violet-700",
  lively: "bg-orange-100 text-orange-700",
  student: "bg-blue-100 text-blue-700",
  calm: "bg-emerald-100 text-emerald-700",
  green: "bg-teal-100 text-teal-700",
};

function resolveIconColor(ambiance: string | null | undefined): string {
  const key = ambiance?.trim().toLowerCase() ?? "";
  return AMBIANCE_ICON_COLORS[key] ?? "bg-neutral-100 text-neutral-600";
}

function resolveAmbianceShortLabel(ambiance: string | null | undefined): string {
  const badge = neighborhoodAmbianceBadge(ambiance);
  if (badge.includes("culture")) return "Culturel";
  if (badge.includes("vivante")) return "Vivant";
  if (badge.includes("étudiante")) return "Étudiant";
  if (badge.includes("calme")) return "Calme";
  if (badge.includes("Nature")) return "Vert";
  return "Local";
}

export function MapDesktopNeighborhoodAmbianceList({
  city,
  neighborhoods,
}: MapDesktopNeighborhoodAmbianceListProps) {
  const items = neighborhoods.filter((hood) => hood.is_active).slice(0, 3);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-map-desktop-neighborhood-ambiance=""
    >
      <h3 className="text-sm font-bold text-neutral-950">{MAP_RAIL_NEIGHBORHOOD_AMBIANCE_TITLE}</h3>
      <ul className="mt-3 divide-y divide-neutral-100">
        {items.map((hood) => (
          <li key={hood.slug}>
            <Link
              href={`/neighborhoods/${encodeURIComponent(hood.slug)}?city=${encodeURIComponent(city)}`}
              className="flex items-center gap-3 py-3 transition hover:opacity-80"
            >
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${resolveIconColor(hood.ambiance)}`}
                aria-hidden
              >
                {hood.display_name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">{hood.display_name}</p>
                <p className="text-xs text-neutral-500">{resolveAmbianceShortLabel(hood.ambiance)}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
