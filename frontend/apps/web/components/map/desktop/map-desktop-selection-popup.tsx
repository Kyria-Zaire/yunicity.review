"use client";

import { MapMediaThumbnail } from "@/components/map/map-media-thumbnail";
import type { MapSelectedPanelPayload } from "@yunicity/utils";
import { MAP_PANEL_CLOSE } from "@yunicity/utils";
import { Calendar, X } from "lucide-react";
import Link from "next/link";

type MapDesktopSelectionPopupProps = {
  payload: MapSelectedPanelPayload;
  onClose: () => void;
};

function resolveImageUrl(payload: MapSelectedPanelPayload): string | null {
  if (payload.kind === "place") {
    return payload.imageUrl;
  }
  return null;
}

function resolveMeta(payload: MapSelectedPanelPayload): string {
  if (payload.kind === "event") {
    return payload.meta;
  }
  if (payload.kind === "place") {
    return payload.meta;
  }
  return payload.meta;
}

function resolveHref(payload: MapSelectedPanelPayload): string {
  return payload.href;
}

export function MapDesktopSelectionPopup({ payload, onClose }: MapDesktopSelectionPopupProps) {
  const imageUrl = resolveImageUrl(payload);
  const meta = resolveMeta(payload);
  const href = resolveHref(payload);

  return (
    <div
      className="pointer-events-auto absolute left-1/2 top-1/2 z-20 w-[min(340px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-xl"
      role="dialog"
      aria-label="Détail sélectionné"
      data-map-desktop-selection-popup=""
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={MAP_PANEL_CLOSE}
        className="absolute right-2 top-2 rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <div className="flex items-center gap-3 pr-6">
        {imageUrl ? (
          <MapMediaThumbnail
            src={imageUrl}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
            fallback={
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[10px] font-semibold uppercase text-neutral-400">
                Lieu
              </div>
            }
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
            <Calendar className="h-5 w-5 text-yunicity-primary" aria-hidden />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-sm font-bold leading-snug text-neutral-950">
            {payload.title}
          </h2>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {meta}
          </p>
          <Link
            href={href}
            className="mt-2 inline-flex rounded-lg bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yunicity-primary-hover"
          >
            Voir
          </Link>
        </div>
      </div>
    </div>
  );
}
