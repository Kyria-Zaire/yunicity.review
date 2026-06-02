"use client";

import type { SettingsHubGroup, SettingsHubRow, SettingsSectionId } from "@yunicity/utils";
import {
  SETTINGS_GROUP_ACCOUNT,
  SETTINGS_GROUP_OTHER,
  SETTINGS_GROUP_PREFERENCES,
  SETTINGS_LOGOUT,
  SETTINGS_LOGOUT_DESC,
  SETTINGS_PORTAL_SUBTITLE,
  SETTINGS_PORTAL_TITLE,
  SETTINGS_SOON,
  settingsIconToneClass,
  settingsSectionDomId,
} from "@yunicity/utils";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Monitor,
  Shield,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ROW_ICONS: Record<SettingsSectionId, LucideIcon> = {
  personal: User,
  security: Lock,
  verification: ShieldCheck,
  notifications: Bell,
  display: Monitor,
  privacy: Shield,
  personalization: Star,
  help: HelpCircle,
  about: Info,
  devices: Monitor,
  export: Info,
  delete: LogOut,
};

type SettingsHubRowsProps = {
  groups: SettingsHubGroup[];
  onNavigate: (sectionId: SettingsSectionId) => void;
  onLogout: () => void;
};

function SettingsRowButton({
  row,
  onNavigate,
}: {
  row: SettingsHubRow;
  onNavigate: (sectionId: SettingsSectionId) => void;
}) {
  const Icon = ROW_ICONS[row.id];
  const toneClass = settingsIconToneClass(row.iconTone);

  return (
    <button
      type="button"
      onClick={() => row.available && onNavigate(row.id)}
      disabled={!row.available}
      className={`flex w-full items-center gap-4 rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
        row.available ? "hover:border-neutral-300 hover:shadow-sm" : "cursor-not-allowed opacity-70"
      }`}
    >
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900">{row.label}</span>
          {!row.available && row.soonLabel ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
              {row.soonLabel ?? SETTINGS_SOON}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-neutral-500">{row.description}</span>
      </span>
      {row.available ? (
        <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300" aria-hidden />
      ) : null}
    </button>
  );
}

export function SettingsHubRows({ groups, onNavigate, onLogout }: SettingsHubRowsProps) {
  const groupLabels: Record<string, string> = {
    account: SETTINGS_GROUP_ACCOUNT,
    preferences: SETTINGS_GROUP_PREFERENCES,
    other: SETTINGS_GROUP_OTHER,
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{SETTINGS_PORTAL_TITLE}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">{SETTINGS_PORTAL_SUBTITLE}</p>
      </header>

      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`settings-group-${group.id}`}>
          <h2
            id={`settings-group-${group.id}`}
            className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400"
          >
            {groupLabels[group.id] ?? group.label}
          </h2>
          <div className="space-y-2">
            {group.rows.map((row) => (
              <SettingsRowButton key={row.id} row={row} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="settings-logout-heading">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-4 rounded-2xl border border-red-100 bg-white px-4 py-4 text-left transition hover:border-red-200 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <LogOut className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-red-600">{SETTINGS_LOGOUT}</span>
            <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
              {SETTINGS_LOGOUT_DESC}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-red-200" aria-hidden />
        </button>
      </section>
    </div>
  );
}

export function scrollToSettingsSection(sectionId: SettingsSectionId) {
  document.getElementById(settingsSectionDomId(sectionId))?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}
