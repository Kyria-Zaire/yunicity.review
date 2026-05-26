"use client";

import type { CulturalPlaceListItem, MapRouteSummary } from "@yunicity/types";
import {
  MAP_CULTURE_CLOSE_ROUTE,
  MAP_CULTURE_ROUTE_ERROR,
  MAP_CULTURE_ROUTE_PANEL_PREFIX,
  formatRouteDistance,
  formatRouteDuration,
} from "@yunicity/utils";

type MapRoutePanelProps = {
  target: CulturalPlaceListItem | null;
  summary: MapRouteSummary | null;
  error: boolean;
  onClose: () => void;
};

export function MapRoutePanel({ target, summary, error, onClose }: MapRoutePanelProps) {
  if (!target) {
    return null;
  }

  return (
    <div className="absolute left-4 right-4 top-4 z-10 rounded-xl border border-neutral-200/90 bg-white/95 p-3 shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {MAP_CULTURE_ROUTE_PANEL_PREFIX}
          </p>
          <p className="font-semibold text-neutral-900">{target.name}</p>
          {error ? (
            <p className="mt-1 text-sm text-neutral-600">{MAP_CULTURE_ROUTE_ERROR}</p>
          ) : summary ? (
            <p className="mt-1 text-sm text-neutral-600">
              {formatRouteDuration(summary.durationSeconds)} ·{" "}
              {formatRouteDistance(summary.distanceMeters)} · à pied
            </p>
          ) : (
            <p className="mt-1 text-sm text-neutral-500">Calcul de l’itinéraire…</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          {MAP_CULTURE_CLOSE_ROUTE}
        </button>
      </div>
    </div>
  );
}
