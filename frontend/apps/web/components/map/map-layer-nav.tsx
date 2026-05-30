"use client";

import {
  MAP_LAYER_LABELS,
  MAP_TERRITORY_LAYERS,
  type MapTerritoryLayer,
} from "@yunicity/utils";

type MapLayerNavProps = {
  activeLayer: MapTerritoryLayer;
  onSelectLayer: (layer: MapTerritoryLayer) => void;
};

export function MapLayerNav({ activeLayer, onSelectLayer }: MapLayerNavProps) {
  return (
    <nav
      className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Couches de la carte"
    >
      {MAP_TERRITORY_LAYERS.map((layer) => {
        const active = layer === activeLayer;
        return (
          <button
            key={layer}
            type="button"
            onClick={() => onSelectLayer(layer)}
            aria-pressed={active}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
              active
                ? "bg-yunicity-primary text-white shadow-sm"
                : "border border-neutral-200/90 bg-white text-neutral-700 hover:border-yunicity-primary/30 hover:text-yunicity-primary"
            }`}
          >
            {MAP_LAYER_LABELS[layer]}
          </button>
        );
      })}
    </nav>
  );
}
