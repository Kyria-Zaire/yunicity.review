"use client";

import type { Neighborhood } from "@yunicity/types";
import type { TribesDesktopVisibilityId } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_NEIGHBORHOODS_TITLE,
  TRIBES_DESKTOP_NEIGHBORHOOD_ALL,
  TRIBES_DESKTOP_PRIVACY_ALL,
  TRIBES_DESKTOP_PRIVACY_ON_REQUEST,
  TRIBES_DESKTOP_PRIVACY_PUBLIC,
  TRIBES_DESKTOP_PRIVACY_TITLE,
  TRIBES_DESKTOP_RESET_FILTERS,
  TRIBES_MEDIUM_FILTERS_TITLE,
} from "@yunicity/utils";
import { Sheet } from "@yunicity/ui/primitives";
import { Building2, Globe, Lock, MapPin, RotateCcw } from "lucide-react";
import type { RefObject } from "react";

import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";

type TribesMediumFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: string;
  activeVisibility: TribesDesktopVisibilityId;
  activeNeighborhood: string;
  neighborhoods: Neighborhood[];
  onVisibilityChange: (visibilityId: TribesDesktopVisibilityId) => void;
  onNeighborhoodChange: (slug: string) => void;
  onResetFilters: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function TribesMediumFilterSheet({
  open,
  onOpenChange,
  city,
  activeVisibility,
  activeNeighborhood,
  neighborhoods,
  onVisibilityChange,
  onNeighborhoodChange,
  onResetFilters,
  returnFocusRef,
}: TribesMediumFilterSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={TRIBES_MEDIUM_FILTERS_TITLE}
      closeLabel="Fermer"
      returnFocusRef={returnFocusRef}
      zIndex={NAVIGATION_MODAL_Z_INDEX}
      className="tribes-medium-filter-sheet max-w-md"
    >
      <div className="space-y-5 px-1 pb-6" data-tribes-medium-filter-sheet="">
        <div>
          <p className="text-sm font-bold text-neutral-900">{TRIBES_DESKTOP_PRIVACY_TITLE}</p>
          <nav className="mt-2 space-y-1" aria-label={TRIBES_DESKTOP_PRIVACY_TITLE}>
            {(
              [
                { id: "all" as const, label: TRIBES_DESKTOP_PRIVACY_ALL, icon: Globe },
                { id: "public" as const, label: TRIBES_DESKTOP_PRIVACY_PUBLIC, icon: Globe },
                { id: "on_request" as const, label: TRIBES_DESKTOP_PRIVACY_ON_REQUEST, icon: Lock },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onVisibilityChange(option.id)}
                aria-pressed={activeVisibility === option.id}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeVisibility === option.id
                    ? "bg-[#EEF0FF] text-yunicity-primary"
                    : "text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                <option.icon className="h-4 w-4 shrink-0" aria-hidden />
                {option.label}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-sm font-bold text-neutral-900">{TRIBES_DESKTOP_NEIGHBORHOODS_TITLE}</p>
          <nav className="mt-2 space-y-1" aria-label={TRIBES_DESKTOP_NEIGHBORHOODS_TITLE}>
            <button
              type="button"
              onClick={() => onNeighborhoodChange("all")}
              aria-pressed={activeNeighborhood === "all"}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                activeNeighborhood === "all"
                  ? "bg-[#EEF0FF] text-yunicity-primary"
                  : "text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {TRIBES_DESKTOP_NEIGHBORHOOD_ALL(city)}
            </button>
            {neighborhoods.map((hood) => (
              <button
                key={hood.id}
                type="button"
                onClick={() => onNeighborhoodChange(hood.slug)}
                aria-pressed={activeNeighborhood === hood.slug}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  activeNeighborhood === hood.slug
                    ? "bg-[#EEF0FF] text-yunicity-primary"
                    : "text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                <Building2 className="h-4 w-4 shrink-0" aria-hidden />
                {hood.display_name}
              </button>
            ))}
          </nav>
        </div>

        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/30 px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary hover:bg-[#EEF0FF]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          {TRIBES_DESKTOP_RESET_FILTERS}
        </button>
      </div>
    </Sheet>
  );
}
