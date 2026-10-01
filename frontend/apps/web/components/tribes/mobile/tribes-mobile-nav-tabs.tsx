"use client";

import type { TribesDesktopNavId } from "@yunicity/utils";
import {
  TRIBES_MEDIUM_NAV_DISCOVER,
  TRIBES_MEDIUM_NAV_INVITATIONS,
  TRIBES_MEDIUM_NAV_MINE,
  TRIBES_MEDIUM_NAV_SENT,
} from "@yunicity/utils";
import { Compass, Mail, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_OPTIONS: Array<{ id: TribesDesktopNavId; label: string; icon: LucideIcon }> = [
  { id: "discover", label: TRIBES_MEDIUM_NAV_DISCOVER, icon: Compass },
  { id: "mine", label: TRIBES_MEDIUM_NAV_MINE, icon: Users },
  { id: "invitations", label: TRIBES_MEDIUM_NAV_INVITATIONS, icon: Mail },
  { id: "sent_requests", label: TRIBES_MEDIUM_NAV_SENT, icon: UserPlus },
];

type TribesMobileNavTabsProps = {
  activeNav: TribesDesktopNavId;
  onNavChange: (navId: TribesDesktopNavId) => void;
};

export function TribesMobileNavTabs({ activeNav, onNavChange }: TribesMobileNavTabsProps) {
  return (
    <nav
      aria-label="Vues tribus"
      className="-mb-px flex gap-0.5 overflow-x-auto border-b border-neutral-200/90 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-tribes-mobile-nav-tabs=""
    >
      {NAV_OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = activeNav === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onNavChange(option.id)}
            aria-pressed={active}
            className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-[13px] font-semibold transition ${
              active
                ? "border-yunicity-primary text-yunicity-primary"
                : "border-transparent text-neutral-500"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </nav>
  );
}
