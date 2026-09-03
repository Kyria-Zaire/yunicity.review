"use client";

import type { ProfileMe } from "@yunicity/types";
import type { ProfileEditPreviewView } from "@yunicity/utils";
import {
  PROFILE_DESKTOP_BADGE_CITIZEN,
  PROFILE_EDIT_DESKTOP_NAV_ACCOUNT,
  PROFILE_EDIT_DESKTOP_NAV_INTERESTS,
  PROFILE_EDIT_DESKTOP_NAV_NOTIFICATIONS,
  PROFILE_EDIT_DESKTOP_NAV_PRIVACY,
  PROFILE_EDIT_DESKTOP_NAV_PUBLIC,
  PROFILE_EDIT_DESKTOP_NAV_VIEW_PROFILE,
} from "@yunicity/utils";
import {
  Bell,
  ExternalLink,
  Lock,
  Shield,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";

type ProfileEditDesktopNavRailProps = {
  profile: ProfileMe;
  preview: ProfileEditPreviewView;
};

const NAV_ITEMS: {
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

/** Rail gauche — identité + navigation sections (maquette desktop). */
export function ProfileEditDesktopNavRail({ profile, preview }: ProfileEditDesktopNavRailProps) {
  const avatarUrl = profile.avatar_url?.trim() || null;

  return (
    <aside className="hidden min-w-0 xl:block" data-profile-edit-desktop-nav="">
      <div className="sticky top-6 space-y-4">
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-yunicity-primary/10">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-sm font-bold text-yunicity-primary">
                  {preview.displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <span className="inline-flex rounded-md bg-[#EEF0FF] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yunicity-primary">
                {PROFILE_DESKTOP_BADGE_CITIZEN}
              </span>
              <p className="mt-1 truncate text-sm font-bold text-neutral-900">{preview.displayName}</p>
              <p className="truncate text-xs text-neutral-500">@{profile.username}</p>
            </div>
          </div>
        </div>

        <nav aria-label="Navigation édition profil" className="rounded-2xl border border-neutral-200/90 bg-white p-2 shadow-sm">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isExternal = item.href.startsWith("/");
              const className = `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                item.active
                  ? "bg-yunicity-primary text-white"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`;

              return (
                <li key={item.id}>
                  {isExternal ? (
                    <Link href={item.href} className={className}>
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.href} className={className}>
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          href="/profile/me"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/30 bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]/60"
        >
          {PROFILE_EDIT_DESKTOP_NAV_VIEW_PROFILE}
          <ExternalLink className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </aside>
  );
}
