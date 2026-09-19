"use client";

import { Crosshair, Maximize2, Minus, Plus } from "lucide-react";

type MapDesktopMapControlsProps = {
  onLocate: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen?: () => void;
};

export function MapDesktopMapControls({
  onLocate,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
}: MapDesktopMapControlsProps) {
  return (
    <div
      className="pointer-events-auto absolute bottom-24 right-4 z-10 flex flex-col gap-1.5"
      data-map-desktop-map-controls=""
    >
      <button
        type="button"
        onClick={onLocate}
        aria-label="Centrer sur ma position"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/90 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50"
      >
        <Crosshair className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Zoom avant"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/90 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Zoom arrière"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/90 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50"
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      {onToggleFullscreen ? (
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label="Plein écran"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/90 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50"
        >
          <Maximize2 className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
