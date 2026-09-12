"use client";

import type { TribesDesktopNavId } from "@yunicity/utils";
import {
  TRIBES_MEDIUM_FILTERS_TITLE,
  TRIBES_MEDIUM_NAV_DISCOVER,
  TRIBES_MEDIUM_NAV_INVITATIONS,
  TRIBES_MEDIUM_NAV_MINE,
  TRIBES_MEDIUM_NAV_SENT,
} from "@yunicity/utils";
import { Compass, Mail, SlidersHorizontal, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_OPTIONS: Array<{ id: TribesDesktopNavId; label: string; icon: LucideIcon }> = [
  { id: "discover", label: TRIBES_MEDIUM_NAV_DISCOVER, icon: Compass },
  { id: "mine", label: TRIBES_MEDIUM_NAV_MINE, icon: Users },
  { id: "invitations", label: TRIBES_MEDIUM_NAV_INVITATIONS, icon: Mail },
  { id: "sent_requests", label: TRIBES_MEDIUM_NAV_SENT, icon: UserPlus },
];

type TribesMediumNavTabsProps = {
  activeNav: TribesDesktopNavId;
  activeFilterCount: number;
  filterPanelOpen: boolean;
  onNavChange: (navId: TribesDesktopNavId) => void;
  onOpenFilters: () => void;
  filterButtonRef?: React.Ref<HTMLButtonElement>;
};

export function TribesMediumNavTabs({
  activeNav,
  activeFilterCount,
  filterPanelOpen,
  onNavChange,
  onOpenFilters,
  filterButtonRef,
}: TribesMediumNavTabsProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/90"
      data-tribes-medium-nav-tabs=""
    >
      <nav aria-label="Vues tribus" className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {NAV_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = activeNav === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onNavChange(option.id)}
              aria-pressed={active}
              className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-sm font-semibold transition ${
                active
                  ? "border-yunicity-primary text-yunicity-primary"
                  : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {option.label}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        ref={filterButtonRef}
        onClick={onOpenFilters}
        aria-expanded={filterPanelOpen}
        aria-haspopup="dialog"
        aria-pressed={activeFilterCount > 0}
        className={`mb-2 inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
          activeFilterCount > 0
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
            : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        {TRIBES_MEDIUM_FILTERS_TITLE}
        {activeFilterCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yunicity-primary px-1.5 text-[11px] font-bold text-white">
            {activeFilterCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
