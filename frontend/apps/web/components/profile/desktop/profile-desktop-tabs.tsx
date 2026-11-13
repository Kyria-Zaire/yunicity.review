"use client";

import type { ProfileDesktopTabId } from "@yunicity/utils";
import {
  PROFILE_DESKTOP_TAB_ABOUT,
  PROFILE_DESKTOP_TAB_ACTIVITY,
  PROFILE_DESKTOP_TAB_CONTRIBUTIONS,
  PROFILE_DESKTOP_TAB_OVERVIEW,
  PROFILE_DESKTOP_TAB_PUBLICATIONS,
} from "@yunicity/utils";

const PUBLIC_TABS: { id: ProfileDesktopTabId; label: string }[] = [
  { id: "overview", label: PROFILE_DESKTOP_TAB_OVERVIEW },
  { id: "publications", label: PROFILE_DESKTOP_TAB_PUBLICATIONS },
  { id: "contributions", label: PROFILE_DESKTOP_TAB_CONTRIBUTIONS },
  { id: "about", label: PROFILE_DESKTOP_TAB_ABOUT },
];

const OWNER_TABS: { id: ProfileDesktopTabId; label: string }[] = [
  ...PUBLIC_TABS,
  { id: "activity", label: PROFILE_DESKTOP_TAB_ACTIVITY },
];

type ProfileDesktopTabsProps = {
  activeTab: ProfileDesktopTabId;
  onChange: (tab: ProfileDesktopTabId) => void;
  variant?: "public" | "owner";
};

/** Onglets profil — bordure bas intégrée au header. */
export function ProfileDesktopTabs({
  activeTab,
  onChange,
  variant = "public",
}: ProfileDesktopTabsProps) {
  const tabs = variant === "owner" ? OWNER_TABS : PUBLIC_TABS;
  return (
    <nav
      aria-label="Sections du profil"
      className="-mx-5 border-t border-neutral-100 px-5 sm:-mx-6 sm:px-6"
      data-profile-desktop-tabs=""
    >
      <ul className="flex flex-wrap gap-0.5">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={active ? "page" : undefined}
                className={`relative px-3.5 py-3.5 text-sm font-semibold transition sm:px-4 ${
                  active
                    ? "text-yunicity-primary"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {tab.label}
                {active ? (
                  <span
                    className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-yunicity-primary"
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
