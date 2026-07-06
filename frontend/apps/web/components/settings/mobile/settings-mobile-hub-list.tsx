"use client";

import type { SettingsHubGroup, SettingsHubRow, SettingsSectionId } from "@yunicity/utils";
import {
  SETTINGS_DELETE_TITLE,
  SETTINGS_DEVICES_TITLE,
  SETTINGS_EXPORT_TITLE,
  SETTINGS_GROUP_ACCOUNT,
  SETTINGS_GROUP_OTHER,
  SETTINGS_GROUP_PREFERENCES,
  SETTINGS_LOGOUT,
  SETTINGS_LOGOUT_DESC,
  SETTINGS_RAIL_SHORTCUTS,
  SETTINGS_SOON,
  settingsIconToneClass,
} from "@yunicity/utils";
import {
  Bell,
  ChevronRight,
  Download,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Monitor,
  Shield,
  ShieldCheck,
  Star,
  Trash2,
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
  export: Download,
  delete: Trash2,
};

type SettingsMobileHubListProps = {
  groups: SettingsHubGroup[];
  onNavigate: (sectionId: SettingsSectionId) => void;
  onLogout: () => void;
};

function SettingsMobileRowButton({
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
      className={`flex w-full items-center gap-3 rounded-xl border border-neutral-200/90 bg-white px-3 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
        row.available ? "hover:border-neutral-300 hover:shadow-sm" : "cursor-not-allowed opacity-70"
      }`}
    >
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
      >
        <Icon className="h-4 w-4" aria-hidden />
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
        <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">{row.description}</span>
      </span>
      {row.available ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
      ) : null}
    </button>
  );
}

function ShortcutRow({
  icon: Icon,
  label,
  available,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  available: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available}
      className={`flex w-full items-center gap-3 rounded-xl border border-neutral-200/90 bg-white px-3 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
        available ? "hover:border-neutral-300 hover:shadow-sm" : "cursor-not-allowed opacity-70"
      }`}
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold text-neutral-900">{label}</span>
      {available ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
      ) : (
        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
          {SETTINGS_SOON}
        </span>
      )}
    </button>
  );
}

/** Liste hub mobile Paramètres (MOBILE-SETTINGS-01). */
export function SettingsMobileHubList({ groups, onNavigate, onLogout }: SettingsMobileHubListProps) {
  const groupLabels: Record<string, string> = {
    account: SETTINGS_GROUP_ACCOUNT,
    preferences: SETTINGS_GROUP_PREFERENCES,
    other: SETTINGS_GROUP_OTHER,
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`settings-mobile-group-${group.id}`}>
          <h2
            id={`settings-mobile-group-${group.id}`}
            className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400"
          >
            {groupLabels[group.id] ?? group.label}
          </h2>
          <div className="space-y-2">
            {group.rows.map((row) => (
              <SettingsMobileRowButton key={row.id} row={row} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="settings-mobile-shortcuts">
        <h2
          id="settings-mobile-shortcuts"
          className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400"
        >
          {SETTINGS_RAIL_SHORTCUTS}
        </h2>
        <div className="space-y-2">
          <ShortcutRow
            icon={Monitor}
            label={SETTINGS_DEVICES_TITLE}
            available
            onClick={() => onNavigate("devices")}
          />
          <ShortcutRow
            icon={Download}
            label={SETTINGS_EXPORT_TITLE}
            available={false}
            onClick={() => onNavigate("export")}
          />
          <ShortcutRow
            icon={Trash2}
            label={SETTINGS_DELETE_TITLE}
            available={false}
            onClick={() => onNavigate("delete")}
          />
        </div>
      </section>

      <section aria-labelledby="settings-mobile-logout">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-white px-3 py-3 text-left transition hover:border-red-200 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <LogOut className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-red-600">{SETTINGS_LOGOUT}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
              {SETTINGS_LOGOUT_DESC}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-red-200" aria-hidden />
        </button>
      </section>
    </div>
  );
}
