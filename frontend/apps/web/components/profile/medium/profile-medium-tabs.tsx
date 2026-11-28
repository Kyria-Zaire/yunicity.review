"use client";

import type { ProfileDesktopTabId } from "@yunicity/utils";
import {
  PROFILE_DESKTOP_TAB_ABOUT,
  PROFILE_DESKTOP_TAB_CONTRIBUTIONS,
  PROFILE_DESKTOP_TAB_OVERVIEW,
  PROFILE_DESKTOP_TAB_PUBLICATIONS,
  PROFILE_MEDIUM_TAB_ACTIVITY,
} from "@yunicity/utils";

const PUBLIC_TABS: { id: ProfileDesktopTabId; label: string }[] = [
  { id: "overview", label: PROFILE_DESKTOP_TAB_OVERVIEW },
  { id: "publications", label: PROFILE_DESKTOP_TAB_PUBLICATIONS },
  { id: "contributions", label: PROFILE_DESKTOP_TAB_CONTRIBUTIONS },
  { id: "about", label: PROFILE_DESKTOP_TAB_ABOUT },
];

const OWNER_TABS: { id: ProfileDesktopTabId; label: string }[] = [
  ...PUBLIC_TABS,
  { id: "activity", label: PROFILE_MEDIUM_TAB_ACTIVITY },
];

type ProfileMediumTabsProps = {
  activeTab: ProfileDesktopTabId;
  onChange: (tab: ProfileDesktopTabId) => void;
  /** owner = /profile/me · public = profil visiteur */
  variant?: "owner" | "public";
};

/** Navbar profil medium — onglets + séparateur pleine largeur. */
export function ProfileMediumTabs({
  activeTab,
  onChange,
  variant = "owner",
}: ProfileMediumTabsProps) {
  const tabs = variant === "public" ? PUBLIC_TABS : OWNER_TABS;

  return (
    <nav
      aria-label="Sections du profil"
      className="profile-medium-tab-nav border-t border-neutral-200"
      data-profile-medium-tabs=""
    >
      <ul className="flex gap-0 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <li key={tab.id} className="min-w-0 flex-1 shrink-0">
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={active ? "page" : undefined}
                className={`relative w-full whitespace-nowrap px-2 py-3.5 text-center text-sm font-semibold transition sm:px-3 ${
                  active ? "text-yunicity-primary" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {tab.label}
                {active ? (
                  <span
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-yunicity-primary"
                    aria-hidden
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
