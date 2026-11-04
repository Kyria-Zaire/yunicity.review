"use client";

import {
  PROFILE_EDIT_DESKTOP_NAV_ACCOUNT,
  PROFILE_EDIT_DESKTOP_NAV_INTERESTS,
  PROFILE_EDIT_DESKTOP_NAV_NOTIFICATIONS,
  PROFILE_EDIT_DESKTOP_NAV_PRIVACY,
  PROFILE_EDIT_DESKTOP_NAV_PUBLIC,
  PROFILE_EDIT_DESKTOP_NAV_VIEW_PROFILE,
} from "@yunicity/utils";
import { Bell, ExternalLink, Lock, Shield, Star, UserRound } from "lucide-react";
import Link from "next/link";

const TAB_ITEMS: {
  id: string;
  label: string;
  href: string;
  icon: typeof UserRound;
  active?: boolean;
}[] = [
  { id: "public", label: PROFILE_EDIT_DESKTOP_NAV_PUBLIC, href: "#profile-edit-public", icon: UserRound, active: true },
  { id: "interests", label: PROFILE_EDIT_DESKTOP_NAV_INTERESTS, href: "#profile-edit-interests", icon: Star },
  { id: "privacy", label: PROFILE_EDIT_DESKTOP_NAV_PRIVACY, href: "/settings#privacy", icon: Shield },
  { id: "account", label: PROFILE_EDIT_DESKTOP_NAV_ACCOUNT, href: "/settings#security", icon: Lock },
  { id: "notifications", label: PROFILE_EDIT_DESKTOP_NAV_NOTIFICATIONS, href: "/settings#notifications", icon: Bell },
];

/** Barre d'onglets horizontale — navigation sections édition (maquette medium). */
export function ProfileEditMediumTabBar() {
  return (
    <nav
      aria-label="Sections du profil"
      className="profile-edit-medium-tab-bar -mx-3 mb-5 overflow-x-auto px-3 sm:-mx-4 sm:px-4"
      data-profile-edit-medium-tabs=""
    >
      <div className="flex min-w-max items-center gap-1 border-b border-neutral-200 pb-0">
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const isExternal = item.href.startsWith("/");
          const className = item.active
            ? "inline-flex shrink-0 items-center gap-2 border-b-2 border-yunicity-primary px-3 py-2.5 text-sm font-semibold text-yunicity-primary"
            : "inline-flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-900";

          const content = (
            <>
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </>
          );

          return isExternal ? (
            <Link key={item.id} href={item.href} className={className}>
              {content}
            </Link>
          ) : (
            <a key={item.id} href={item.href} className={className} aria-current={item.active ? "page" : undefined}>
              {content}
            </a>
          );
        })}

        <Link
          href="/profile/me"
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PROFILE_EDIT_DESKTOP_NAV_VIEW_PROFILE}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
