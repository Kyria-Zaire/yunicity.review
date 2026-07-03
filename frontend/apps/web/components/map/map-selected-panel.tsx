"use client";

import type { MapSelectedPanelPayload } from "@yunicity/utils";
import {
  MAP_PANEL_CLOSE,
  MAP_PANEL_NEIGHBORHOOD_MOMENTS,
  MAP_PANEL_NEIGHBORHOOD_VIEW,
  MAP_PANEL_TRIBE_VIEW,
} from "@yunicity/utils";
import { MapMediaThumbnail } from "@/components/map/map-media-thumbnail";
import Link from "next/link";

type MapSelectedPanelProps = {
  payload: MapSelectedPanelPayload;
  onClose: () => void;
};

export function MapSelectedPanel({ payload, onClose }: MapSelectedPanelProps) {
  return (
    <div
      className="pointer-events-auto absolute bottom-20 left-4 right-4 z-20 mx-auto max-w-md rounded-2xl border border-neutral-200/90 bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:bottom-4 sm:left-auto sm:right-4 sm:mx-0"
      role="dialog"
      aria-label="Détail sélectionné"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-yunicity-primary">
            {payload.kind === "event"
              ? "Moment"
              : payload.kind === "place"
                ? "Lieu"
                : payload.kind === "neighborhood"
                  ? "Quartier"
                  : "Tribu"}
          </p>
          <h2 className="mt-0.5 line-clamp-2 text-base font-semibold text-neutral-900">{payload.title}</h2>
          <p className="mt-1 text-xs text-neutral-600">{payload.meta}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={MAP_PANEL_CLOSE}
          className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          {MAP_PANEL_CLOSE}
        </button>
      </div>

      {payload.kind === "event" ? (
        <>
          {/* TODO(WEB-PARTNERS-07): partner badge non disponible ici —
              MapEventItem (GET /map/events) ne retourne pas organization.
              À activer quand l'endpoint map exposera is_partner + partner_status. */}
          <p className="mt-2 text-xs text-neutral-500">{payload.location}</p>
          <div className="mt-3">
            <Link
              href={payload.href}
              className="rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
            >
              Voir le moment
            </Link>
          </div>
        </>
      ) : null}

      {payload.kind === "place" ? (
        <>
          {payload.imageUrl ? (
            <MapMediaThumbnail
              src={payload.imageUrl}
              className="mt-3 h-24 w-full rounded-xl object-cover"
            />
          ) : null}
          {payload.credit ? (
            <p className="mt-1 text-[10px] text-neutral-400">{payload.credit}</p>
          ) : null}
          <div className="mt-3">
            <Link
              href={payload.href}
              className="rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
            >
              Voir le lieu
            </Link>
          </div>
        </>
      ) : null}

      {payload.kind === "neighborhood" ? (
        <>
          {payload.approximateNote ? (
            <p className="mt-2 text-xs text-neutral-500">{payload.approximateNote}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={payload.href}
              className="rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
            >
              {MAP_PANEL_NEIGHBORHOOD_VIEW}
            </Link>
            <Link
              href={payload.momentsHref}
              className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-yunicity-primary/30"
            >
              {MAP_PANEL_NEIGHBORHOOD_MOMENTS}
            </Link>
          </div>
        </>
      ) : null}

      {payload.kind === "tribe" ? (
        <>
          <p className="mt-2 line-clamp-2 text-xs text-neutral-600">{payload.description}</p>
          <p className="mt-1 text-[10px] text-neutral-500">{payload.anchorLabel}</p>
          <div className="mt-3">
            <Link
              href={payload.href}
              className="rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
            >
              {MAP_PANEL_TRIBE_VIEW}
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
