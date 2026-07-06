"use client";

import type { ProfileMobileContentTabId } from "@yunicity/utils";
import {
  PROFILE_MOBILE_TAB_PHOTOS,
  PROFILE_MOBILE_TAB_PUBLICATIONS,
  PROFILE_MOBILE_TAB_REVIEWS,
  PROFILE_MOBILE_TAB_VIDEOS,
} from "@yunicity/utils";

const TABS: { id: ProfileMobileContentTabId; label: string; enabled: boolean }[] = [
  { id: "publications", label: PROFILE_MOBILE_TAB_PUBLICATIONS, enabled: true },
  { id: "videos", label: PROFILE_MOBILE_TAB_VIDEOS, enabled: false },
  { id: "reviews", label: PROFILE_MOBILE_TAB_REVIEWS, enabled: false },
  { id: "photos", label: PROFILE_MOBILE_TAB_PHOTOS, enabled: false },
];

type ProfileMobileContentTabsProps = {
  activeTab: ProfileMobileContentTabId;
  onSelectTab: (tab: ProfileMobileContentTabId) => void;
};

/** Onglets contenu profil mobile (MOBILE-PROFILE-01). */
export function ProfileMobileContentTabs({
  activeTab,
  onSelectTab,
}: ProfileMobileContentTabsProps) {
  return (
    <nav
      aria-label="Contenus du profil"
      className="-mx-4 overflow-x-auto border-b border-neutral-200 px-4"
    >
      <ul className="flex min-w-max gap-5">
        {TABS.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              disabled={!tab.enabled}
              onClick={() => tab.enabled && onSelectTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`-mb-px shrink-0 border-b-2 pb-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "border-yunicity-primary text-yunicity-primary"
                  : tab.enabled
                    ? "border-transparent text-neutral-500 hover:text-neutral-800"
                    : "cursor-not-allowed border-transparent text-neutral-300"
              }`}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
