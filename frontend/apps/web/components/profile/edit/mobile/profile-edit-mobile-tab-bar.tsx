"use client";

import {
  PROFILE_EDIT_DESKTOP_NAV_INTERESTS,
  PROFILE_EDIT_DESKTOP_NAV_NOTIFICATIONS,
  PROFILE_EDIT_DESKTOP_NAV_PRIVACY,
  PROFILE_EDIT_DESKTOP_NAV_PUBLIC,
  PROFILE_EDIT_DESKTOP_NAV_VIEW_PROFILE,
} from "@yunicity/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

const PROFILE_EDIT_MOBILE_NAV_SECURITY = "Sécurité";

const TAB_ITEMS: {
  id: string;
  label: string;
  href: string;
  active?: boolean;
}[] = [
  { id: "public", label: PROFILE_EDIT_DESKTOP_NAV_PUBLIC, href: "#profile-edit-public", active: true },
  { id: "interests", label: PROFILE_EDIT_DESKTOP_NAV_INTERESTS, href: "#profile-edit-interests" },
  { id: "privacy", label: PROFILE_EDIT_DESKTOP_NAV_PRIVACY, href: "/settings#privacy" },
  { id: "security", label: PROFILE_EDIT_MOBILE_NAV_SECURITY, href: "/settings#security" },
  { id: "notifications", label: PROFILE_EDIT_DESKTOP_NAV_NOTIFICATIONS, href: "/settings#notifications" },
];

/** Onglets pill scrollables — maquette mobile édition profil. */
export function ProfileEditMobileTabBar() {
  return (
    <div data-profile-edit-mobile-tabs="">
      <nav
        aria-label="Sections du profil"
        className="profile-edit-mobile-tab-bar -mx-4 overflow-x-auto px-4"
      >
        <div className="flex min-w-max gap-2 pb-3">
          {TAB_ITEMS.map((item) => {
            const className = item.active
              ? "inline-flex shrink-0 items-center rounded-lg bg-yunicity-primary px-3 py-2 text-sm font-semibold text-white shadow-sm"
              : "inline-flex shrink-0 items-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300";

            return item.href.startsWith("/") ? (
              <Link key={item.id} href={item.href} className={className}>
                {item.label}
              </Link>
            ) : (
              <a
                key={item.id}
                href={item.href}
                className={className}
                aria-current={item.active ? "page" : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>

      <div className="flex justify-end pb-1">
        <Link
          href="/profile/me"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PROFILE_EDIT_DESKTOP_NAV_VIEW_PROFILE}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
