"use client";

import {
  SETTINGS_DESKTOP_BREADCRUMB_PROFILE,
  SETTINGS_DESKTOP_BREADCRUMB_SETTINGS,
  SETTINGS_DESKTOP_SUBTITLE,
  SETTINGS_DESKTOP_TITLE,
  SETTINGS_MEDIUM_TABS,
  settingsMediumScrollToSection,
  type SettingsMediumTabId,
} from "@yunicity/utils";
import { Lock, Shield, SlidersHorizontal, User, UserRound } from "lucide-react";
import Link from "next/link";

const TAB_ICONS: Record<SettingsMediumTabId, typeof User> = {
  general: User,
  "public-profile": UserRound,
  security: Lock,
  preferences: SlidersHorizontal,
  privacy: Shield,
};

type SettingsMediumHeaderProps = {
  activeTabId: SettingsMediumTabId;
  onTabChange: (id: SettingsMediumTabId) => void;
};

export function SettingsMediumHeader({ activeTabId, onTabChange }: SettingsMediumHeaderProps) {
  return (
    <header className="mb-5" data-settings-medium-header="">
      <nav aria-label="Fil d'Ariane" className="text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/profile/me" className="hover:text-neutral-800 hover:underline">
              {SETTINGS_DESKTOP_BREADCRUMB_PROFILE}
            </Link>
          </li>
          <li aria-hidden className="text-neutral-400">
            /
          </li>
          <li className="font-medium text-neutral-700">{SETTINGS_DESKTOP_BREADCRUMB_SETTINGS}</li>
        </ol>
      </nav>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        {SETTINGS_DESKTOP_TITLE}
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-neutral-500">
        {SETTINGS_DESKTOP_SUBTITLE}
      </p>

      <div
        className="settings-medium-tabs mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label="Sections paramètres"
      >
        {SETTINGS_MEDIUM_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const active = activeTabId === tab.id;
          const className = `inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
            active
              ? "border-yunicity-primary bg-yunicity-primary text-white shadow-sm"
              : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
          }`;

          if (tab.href) {
            return (
              <Link
                key={tab.id}
                href={tab.href}
                role="tab"
                aria-selected={active}
                className={className}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {tab.label}
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={className}
              onClick={() => {
                onTabChange(tab.id);
                if (tab.sectionId) settingsMediumScrollToSection(tab.sectionId);
              }}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
