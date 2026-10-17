"use client";

import type { DiscussionInboxTab } from "@yunicity/utils";
import {
  DISCUSSIONS_DESKTOP_RESET_FILTERS,
  DISCUSSIONS_DESKTOP_TAB_ALL,
  DISCUSSIONS_DESKTOP_TAB_REQUESTS,
  DISCUSSIONS_DESKTOP_TAB_UNREAD,
  DISCUSSIONS_MEDIUM_FILTERS_TITLE,
} from "@yunicity/utils";
import { Sheet } from "@yunicity/ui/primitives";
import { Inbox, Mail, RotateCcw, UserRoundCheck } from "lucide-react";
import type { RefObject } from "react";

import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";

const TAB_OPTIONS: Array<{
  id: DiscussionInboxTab;
  label: string;
  icon: typeof Inbox;
}> = [
  { id: "all", label: DISCUSSIONS_DESKTOP_TAB_ALL, icon: Inbox },
  { id: "unread", label: DISCUSSIONS_DESKTOP_TAB_UNREAD, icon: Mail },
  { id: "requests", label: DISCUSSIONS_DESKTOP_TAB_REQUESTS, icon: UserRoundCheck },
];

type DiscussionsMediumFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: DiscussionInboxTab;
  onTabChange: (tab: DiscussionInboxTab) => void;
  onResetFilters: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

export function DiscussionsMediumFilterSheet({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  onResetFilters,
  returnFocusRef,
}: DiscussionsMediumFilterSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={DISCUSSIONS_MEDIUM_FILTERS_TITLE}
      closeLabel="Fermer"
      returnFocusRef={returnFocusRef}
      zIndex={NAVIGATION_MODAL_Z_INDEX}
      className="discussions-medium-filter-sheet max-w-md"
    >
      <div className="space-y-5 px-1 pb-6" data-discussions-medium-filter-sheet="">
        <nav className="space-y-1" aria-label={DISCUSSIONS_MEDIUM_FILTERS_TITLE}>
          {TAB_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onTabChange(option.id);
                onOpenChange(false);
              }}
              aria-pressed={activeTab === option.id}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                activeTab === option.id
                  ? "bg-[#EEF0FF] text-yunicity-primary"
                  : "text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              <option.icon className="h-4 w-4 shrink-0" aria-hidden />
              {option.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => {
            onResetFilters();
            onOpenChange(false);
          }}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
        >
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
          {DISCUSSIONS_DESKTOP_RESET_FILTERS}
        </button>
      </div>
    </Sheet>
  );
}
