"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { ProfileMe } from "@yunicity/types";
import {
  SETTINGS_DESKTOP_BADGE_YUNICIZEN,
  SETTINGS_DESKTOP_HELP_NAV,
  SETTINGS_DESKTOP_NAV_GROUPS,
  SETTINGS_DESKTOP_SOON,
  SETTINGS_DESKTOP_VIEW_PROFILE,
  settingsDesktopScrollToSection,
  settingsDesktopUsername,
  type SettingsDesktopNavId,
} from "@yunicity/utils";
import {
  Accessibility,
  Ban,
  Bell,
  CircleHelp,
  Eye,
  ExternalLink,
  FileText,
  MapPin,
  Shield,
  User,
  UserRound,
} from "lucide-react";
import Link from "next/link";

const NAV_ICONS: Record<SettingsDesktopNavId, typeof User> = {
  general: User,
  "public-profile": UserRound,
  security: Shield,
  city: MapPin,
  notifications: Bell,
  accessibility: Accessibility,
  visibility: Eye,
  blocked: Ban,
  data: FileText,
  help: CircleHelp,
};

type SettingsDesktopLeftRailProps = {
  profile: ProfileMe;
  displayName: string;
  activeNavId: SettingsDesktopNavId;
  onNavChange: (id: SettingsDesktopNavId) => void;
};

export function SettingsDesktopLeftRail({
  profile,
  displayName,
  activeNavId,
  onNavChange,
}: SettingsDesktopLeftRailProps) {
  const username = settingsDesktopUsername(profile);

  return (
    <aside
      className="flex w-full min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:pb-4"
      aria-label="Navigation des paramètres"
      data-settings-desktop-left-rail=""
    >
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ProfileAvatar name={displayName} src={profile.avatar_url} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-neutral-900">{displayName}</p>
            <p className="truncate text-xs text-neutral-500">{username}</p>
            <span className="mt-1.5 inline-flex rounded-full bg-yunicity-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {SETTINGS_DESKTOP_BADGE_YUNICIZEN}
            </span>
          </div>
        </div>
      </div>

      <nav className="space-y-5" aria-label="Sections">
        {SETTINGS_DESKTOP_NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = NAV_ICONS[item.id];
                const active = activeNavId === item.id;
                const baseClass = active
                  ? "bg-yunicity-primary text-white shadow-sm"
                  : item.available
                    ? "text-neutral-700 hover:bg-neutral-100"
                    : "cursor-not-allowed text-neutral-400";

                if (item.href) {
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${baseClass}`}
                        onClick={() => onNavChange(item.id)}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={!item.available}
                      aria-current={active ? "page" : undefined}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${baseClass}`}
                      onClick={() => {
                        if (!item.available) return;
                        onNavChange(item.id);
                        if (item.sectionId) settingsDesktopScrollToSection(item.sectionId);
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {!item.available ? (
                        <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-500">
                          {SETTINGS_DESKTOP_SOON}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="border-t border-neutral-200/80 pt-4">
          <button
            type="button"
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              activeNavId === "help"
                ? "bg-yunicity-primary text-white shadow-sm"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
            onClick={() => {
              onNavChange("help");
              settingsDesktopScrollToSection("help");
            }}
          >
            <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
            {SETTINGS_DESKTOP_HELP_NAV.label}
          </button>

          <Link
            href="/profile/me"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/30 bg-white px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          >
            {SETTINGS_DESKTOP_VIEW_PROFILE}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </nav>
    </aside>
  );
}
