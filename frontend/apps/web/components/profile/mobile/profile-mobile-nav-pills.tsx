"use client";

import type { ProfilePortalNavId } from "@yunicity/utils";
import {
  PROFILE_PORTAL_NAV_ACTIVITY,
  PROFILE_PORTAL_NAV_BADGES,
  PROFILE_PORTAL_NAV_EVENTS,
  PROFILE_PORTAL_NAV_FAVORITES,
  PROFILE_PORTAL_NAV_MEMORIES,
  PROFILE_PORTAL_NAV_PROFILE,
  PROFILE_PORTAL_NAV_SETTINGS,
  PROFILE_PORTAL_NAV_TRIBES,
} from "@yunicity/utils";
import Link from "next/link";

const NAV_ITEMS: { id: ProfilePortalNavId; label: string; targetId: string; href?: string }[] = [
  { id: "overview", label: PROFILE_PORTAL_NAV_PROFILE, targetId: "profile-overview" },
  { id: "activity", label: PROFILE_PORTAL_NAV_ACTIVITY, targetId: "profile-activity" },
  { id: "favorites", label: PROFILE_PORTAL_NAV_FAVORITES, targetId: "profile-favorites" },
  { id: "events", label: PROFILE_PORTAL_NAV_EVENTS, targetId: "profile-activity" },
  { id: "tribes", label: PROFILE_PORTAL_NAV_TRIBES, targetId: "profile-tribes" },
  { id: "badges", label: PROFILE_PORTAL_NAV_BADGES, targetId: "profile-badges" },
  { id: "memories", label: PROFILE_PORTAL_NAV_MEMORIES, targetId: "profile-memories" },
  { id: "settings", label: PROFILE_PORTAL_NAV_SETTINGS, targetId: "profile-settings", href: "/settings" },
];

type ProfileMobileNavPillsProps = {
  onNavigate: (targetId: string) => void;
};

/** Pills navigation mobile profil (MOBILE-PROFILE-01). */
export function ProfileMobileNavPills({ onNavigate }: ProfileMobileNavPillsProps) {
  return (
    <nav aria-label="Navigation profil" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-2 pb-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            {item.href ? (
              <Link
                href={item.href}
                className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
              >
                {item.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(item.targetId)}
                className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
