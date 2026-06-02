"use client";

import {
  PROFILE_EDIT_TAB_INFO,
  PROFILE_EDIT_TAB_NOTIFICATIONS,
  PROFILE_EDIT_TAB_PREFS,
  PROFILE_EDIT_TAB_SECURITY,
} from "@yunicity/utils";
import Link from "next/link";

const TABS = [
  { id: "info", label: PROFILE_EDIT_TAB_INFO, href: "/profile/me/edit", active: true },
  { id: "prefs", label: PROFILE_EDIT_TAB_PREFS, href: "/settings#display" },
  { id: "security", label: PROFILE_EDIT_TAB_SECURITY, href: "/settings#security" },
  { id: "notifications", label: PROFILE_EDIT_TAB_NOTIFICATIONS, href: "/settings#notifications" },
] as const;

export function ProfileEditTabs() {
  return (
    <nav
      className="flex flex-wrap gap-6 border-b border-neutral-200"
      aria-label="Sections du profil"
    >
      {TABS.map((tab) =>
        "active" in tab && tab.active ? (
          <span
            key={tab.id}
            className="-mb-px border-b-2 border-yunicity-primary pb-3 text-sm font-semibold text-yunicity-primary"
            aria-current="page"
          >
            {tab.label}
          </span>
        ) : (
          <Link
            key={tab.id}
            href={tab.href}
            className="-mb-px pb-3 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            {tab.label}
          </Link>
        ),
      )}
    </nav>
  );
}
