"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import type { VideosPortalSidebarFilters } from "@yunicity/utils";
import { VIDEOS_DESKTOP_FILTER_CLOSE, VIDEOS_DESKTOP_FILTER_PANEL } from "@yunicity/utils";
import { Sheet } from "@yunicity/ui/primitives";
import type { RefObject } from "react";

import { VideosInternalSidebar } from "@/components/videos/videos-internal-sidebar";
import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";

type VideosFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: VideosPortalSidebarFilters;
  neighborhoods: string[];
  items: readonly LocalVideoFeedItem[];
  onReset: () => void;
  onChange: <K extends keyof VideosPortalSidebarFilters>(
    key: K,
    value: VideosPortalSidebarFilters[K],
  ) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function VideosFilterSheet({
  open,
  onOpenChange,
  filters,
  neighborhoods,
  items,
  onReset,
  onChange,
  returnFocusRef,
}: VideosFilterSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={VIDEOS_DESKTOP_FILTER_PANEL}
      closeLabel={VIDEOS_DESKTOP_FILTER_CLOSE}
      returnFocusRef={returnFocusRef}
      zIndex={NAVIGATION_MODAL_Z_INDEX}
      className="videos-filter-sheet max-w-md"
    >
      <VideosInternalSidebar
        variant="sheet"
        filters={filters}
        neighborhoods={neighborhoods}
        items={items}
        onReset={onReset}
        onChange={onChange}
      />
    </Sheet>
  );
}
