"use client";

import {
  PROFILE_DESKTOP_ABOUT_INTERESTS,
  PROFILE_DESKTOP_ABOUT_TITLE,
  PROFILE_DESKTOP_PUBLIC_TRIBES_TITLE,
  type ProfileDesktopTabId,
} from "@yunicity/utils";
import { ChevronRight, Info, Star, Users } from "lucide-react";

type ProfileMobilePublicNavRowsProps = {
  onOpenTab: (tab: ProfileDesktopTabId) => void;
};

const ROWS: Array<{
  tab: ProfileDesktopTabId;
  label: string;
  icon: typeof Info;
  tone: string;
}> = [
  {
    tab: "about",
    label: PROFILE_DESKTOP_ABOUT_TITLE,
    icon: Info,
    tone: "bg-violet-100 text-violet-700",
  },
  {
    tab: "about",
    label: PROFILE_DESKTOP_ABOUT_INTERESTS,
    icon: Star,
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    tab: "about",
    label: PROFILE_DESKTOP_PUBLIC_TRIBES_TITLE,
    icon: Users,
    tone: "bg-orange-100 text-orange-700",
  },
];

/** Rangées navigation profil public mobile — maquette Aperçu. */
export function ProfileMobilePublicNavRows({ onOpenTab }: ProfileMobilePublicNavRowsProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-profile-mobile-public-nav=""
    >
      <ul className="divide-y divide-neutral-100">
        {ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.label}>
              <button
                type="button"
                onClick={() => onOpenTab(row.tab)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-neutral-50"
              >
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${row.tone}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">
                  {row.label}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
