"use client";

import type {
  AuthUser,
  ProfileMe,
  UserNotificationPreferences,
} from "@yunicity/types";
import type { SettingsAccountStatus, SettingsSectionId } from "@yunicity/utils";
import {
  SETTINGS_LANGUAGE_OPTIONS,
  SETTINGS_MOBILE_ABOUT,
  SETTINGS_MOBILE_ACCESSIBILITY,
  SETTINGS_MOBILE_APPEARANCE,
  SETTINGS_MOBILE_APPEARANCE_SYSTEM,
  SETTINGS_MOBILE_BADGE_YUNICIZEN,
  SETTINGS_MOBILE_BLOCKED,
  SETTINGS_MOBILE_CARD_ACCOUNT,
  SETTINGS_MOBILE_CARD_CITY,
  SETTINGS_MOBILE_CARD_DATA,
  SETTINGS_MOBILE_CARD_DISPLAY,
  SETTINGS_MOBILE_CARD_NOTIFICATIONS,
  SETTINGS_MOBILE_CARD_PRIVACY,
  SETTINGS_MOBILE_CARD_SECURITY,
  SETTINGS_MOBILE_CURRENT_SESSION,
  SETTINGS_MOBILE_DELETE,
  SETTINGS_MOBILE_DELETE_HINT,
  SETTINGS_MOBILE_EDIT_PROFILE,
  SETTINGS_MOBILE_EMAIL,
  SETTINGS_MOBILE_EXPORT,
  SETTINGS_MOBILE_HELP_SUPPORT,
  SETTINGS_MOBILE_IN_APP,
  SETTINGS_MOBILE_LANGUAGE,
  SETTINGS_MOBILE_LOGOUT,
  SETTINGS_MOBILE_MANAGE_PRIVACY,
  SETTINGS_MOBILE_NEIGHBORHOOD,
  SETTINGS_MOBILE_NEIGHBORHOOD_UNDEFINED,
  SETTINGS_MOBILE_PASSWORD,
  SETTINGS_MOBILE_PRECISE_LOCATION,
  SETTINGS_MOBILE_PRECISE_LOCATION_HINT,
  SETTINGS_MOBILE_PREF_CONTRIBUTIONS,
  SETTINGS_MOBILE_PREF_EVENTS,
  SETTINGS_MOBILE_PREF_PASSPORT,
  SETTINGS_MOBILE_PREF_TRIBES,
  SETTINGS_MOBILE_PRIVACY_NEIGHBORHOOD,
  SETTINGS_MOBILE_PRIVACY_POSITION,
  SETTINGS_MOBILE_PRIVACY_PUBLIC,
  SETTINGS_MOBILE_PROFILE_TYPE,
  SETTINGS_MOBILE_SOON,
  SETTINGS_MOBILE_STATUS_ON,
  SETTINGS_MOBILE_THIS_DEVICE,
  formatSettingsDesktopSessionLabel,
  maskSettingsEmail,
  settingsDesktopPrivacySummary,
  settingsMobileSectionDomId,
  settingsMobileSessionsLabel,
} from "@yunicity/utils";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  FileLock2,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Mail,
  MapPin,
  Palette,
  Pencil,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

type SettingsMobileHubProps = {
  user: AuthUser | null;
  profile: ProfileMe;
  preferences: UserNotificationPreferences | null;
  accountStatus: SettingsAccountStatus | null;
  isSavingPrefs: boolean;
  onNavigate: (sectionId: SettingsSectionId) => void;
  onPreferenceChange: (key: keyof UserNotificationPreferences, value: boolean) => void;
  onLogout: () => void;
};

function Card({
  id,
  icon,
  iconClass,
  title,
  children,
}: {
  id: string;
  icon: ReactNode;
  iconClass: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={settingsMobileSectionDomId(id)}
      className="scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </span>
        <h2 className="text-base font-bold text-neutral-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  valueClassName,
  onClick,
  disabled,
  trailing,
}: {
  label: string;
  value?: string;
  valueClassName?: string;
  onClick?: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-neutral-900">{label}</span>
        {value ? (
          <span className={`mt-0.5 block text-sm ${valueClassName ?? "text-neutral-500"}`}>
            {value}
          </span>
        ) : null}
      </span>
      {trailing ??
        (onClick && !disabled ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
        ) : null)}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-60"
      >
        {content}
      </button>
    );
  }

  return <div className="flex items-center gap-3 py-3">{content}</div>;
}

function PreciseLocationToggle() {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-900">{SETTINGS_MOBILE_PRECISE_LOCATION}</p>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={SETTINGS_MOBILE_PRECISE_LOCATION}
          onClick={() => setEnabled((value) => !value)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            enabled ? "bg-yunicity-primary" : "bg-neutral-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        {SETTINGS_MOBILE_PRECISE_LOCATION_HINT}
      </p>
    </div>
  );
}

const PREF_CHIPS = [
  {
    key: "social" as const,
    label: SETTINGS_MOBILE_PREF_EVENTS,
    icon: CalendarDays,
    tone: "text-emerald-600",
  },
  {
    key: "social" as const,
    label: SETTINGS_MOBILE_PREF_TRIBES,
    icon: Users,
    tone: "text-sky-600",
  },
  {
    key: "passport" as const,
    label: SETTINGS_MOBILE_PREF_PASSPORT,
    icon: Globe,
    tone: "text-blue-600",
  },
  {
    key: "offers" as const,
    label: SETTINGS_MOBILE_PREF_CONTRIBUTIONS,
    icon: FileText,
    tone: "text-violet-600",
  },
];

export function SettingsMobileHub({
  user,
  profile,
  preferences,
  accountStatus,
  isSavingPrefs,
  onNavigate,
  onPreferenceChange,
  onLogout,
}: SettingsMobileHubProps) {
  const emailMasked = maskSettingsEmail(user?.email);
  const privacy = settingsDesktopPrivacySummary(profile.visibility);
  const languageLabel =
    SETTINGS_LANGUAGE_OPTIONS.find((option) => option.value === (profile.preferred_language ?? "fr"))
      ?.label ?? "Français";
  const sessionLabel = accountStatus
    ? formatSettingsDesktopSessionLabel(accountStatus.currentDeviceLabel)
    : "Navigateur web";
  const sessionCount = Math.max(1, accountStatus?.pushDeviceCount ?? 1);

  return (
    <div className="space-y-3" data-settings-mobile-hub="">
      <Card
        id="account"
        title={SETTINGS_MOBILE_CARD_ACCOUNT}
        iconClass="bg-blue-50 text-yunicity-primary"
        icon={<Mail className="h-4 w-4" aria-hidden />}
      >
        <div className="divide-y divide-neutral-100">
          <Row
            label={SETTINGS_MOBILE_EMAIL}
            value={emailMasked}
            onClick={() => onNavigate("personal")}
          />
          <Row
            label={SETTINGS_MOBILE_PROFILE_TYPE}
            value={SETTINGS_MOBILE_BADGE_YUNICIZEN}
            onClick={() => onNavigate("personal")}
          />
          <Link
            href="/profile/me/edit"
            className="flex items-center gap-2 py-3 text-sm font-semibold text-yunicity-primary"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            <span className="flex-1">{SETTINGS_MOBILE_EDIT_PROFILE}</span>
            <ChevronRight className="h-4 w-4 text-neutral-300" aria-hidden />
          </Link>
        </div>
      </Card>

      <Card
        id="city"
        title={SETTINGS_MOBILE_CARD_CITY}
        iconClass="bg-blue-50 text-yunicity-primary"
        icon={<MapPin className="h-4 w-4" aria-hidden />}
      >
        <p className="mb-1 text-xl font-bold text-neutral-950">{profile.city?.trim() || "—"}</p>
        <div className="divide-y divide-neutral-100">
          <Row
            label={SETTINGS_MOBILE_NEIGHBORHOOD}
            value={SETTINGS_MOBILE_NEIGHBORHOOD_UNDEFINED}
            onClick={() => onNavigate("personal")}
          />
          <PreciseLocationToggle />
        </div>
      </Card>

      <Card
        id="privacy"
        title={SETTINGS_MOBILE_CARD_PRIVACY}
        iconClass="bg-emerald-50 text-emerald-600"
        icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
      >
        <div className="divide-y divide-neutral-100">
          <Row
            label={SETTINGS_MOBILE_PRIVACY_PUBLIC}
            value={privacy.publicProfile}
            valueClassName={
              privacy.publicProfile === SETTINGS_MOBILE_STATUS_ON
                ? "font-semibold text-emerald-600"
                : "text-neutral-500"
            }
            onClick={() => onNavigate("privacy")}
          />
          <Row
            label={SETTINGS_MOBILE_PRIVACY_NEIGHBORHOOD}
            value={privacy.neighborhoodVisible}
            onClick={() => onNavigate("privacy")}
          />
          <Row
            label={SETTINGS_MOBILE_PRIVACY_POSITION}
            value={privacy.sharedPosition}
            onClick={() => onNavigate("privacy")}
          />
          <button
            type="button"
            onClick={() => onNavigate("privacy")}
            className="flex w-full items-center gap-2 py-3 text-sm font-semibold text-yunicity-primary"
          >
            <span className="flex-1 text-left">{SETTINGS_MOBILE_MANAGE_PRIVACY}</span>
            <ChevronRight className="h-4 w-4 text-neutral-300" aria-hidden />
          </button>
        </div>
      </Card>

      <Card
        id="security"
        title={SETTINGS_MOBILE_CARD_SECURITY}
        iconClass="bg-blue-50 text-yunicity-primary"
        icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
      >
        <div className="divide-y divide-neutral-100">
          <Row
            label={SETTINGS_MOBILE_PASSWORD}
            disabled
            onClick={() => undefined}
            trailing={
              <span className="text-[10px] font-bold uppercase text-neutral-400">
                {SETTINGS_MOBILE_SOON}
              </span>
            }
          />
          <Row
            label={settingsMobileSessionsLabel(sessionCount)}
            value={`${SETTINGS_MOBILE_THIS_DEVICE} · ${sessionLabel} · ${SETTINGS_MOBILE_CURRENT_SESSION}`}
            valueClassName="text-xs font-medium text-emerald-600"
            onClick={() => onNavigate("devices")}
          />
        </div>
      </Card>

      <Card
        id="notifications"
        title={SETTINGS_MOBILE_CARD_NOTIFICATIONS}
        iconClass="bg-violet-50 text-violet-600"
        icon={<Bell className="h-4 w-4" aria-hidden />}
      >
        <div className="settings-mobile-pref-chips -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {PREF_CHIPS.map((chip) => {
            const Icon = chip.icon;
            const active = Boolean(preferences?.[chip.key]);
            return (
              <button
                key={`${chip.key}-${chip.label}`}
                type="button"
                disabled={!preferences || isSavingPrefs}
                aria-pressed={active}
                onClick={() => onPreferenceChange(chip.key, !active)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                  active
                    ? "border-yunicity-primary/35 bg-[#EEF0FF] text-yunicity-primary"
                    : "border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${chip.tone}`} aria-hidden />
                {chip.label}
                <ChevronRight className="h-3.5 w-3.5 text-neutral-300" aria-hidden />
              </button>
            );
          })}
        </div>
        <div className="mt-1 divide-y divide-neutral-100 border-t border-neutral-100">
          <Row label={SETTINGS_MOBILE_IN_APP} onClick={() => onNavigate("notifications")} />
        </div>
      </Card>

      <Card
        id="display"
        title={SETTINGS_MOBILE_CARD_DISPLAY}
        iconClass="bg-amber-50 text-amber-600"
        icon={<Palette className="h-4 w-4" aria-hidden />}
      >
        <div className="divide-y divide-neutral-100">
          <Row
            label={SETTINGS_MOBILE_LANGUAGE}
            value={languageLabel}
            onClick={() => onNavigate("display")}
          />
          <Row
            label={SETTINGS_MOBILE_APPEARANCE}
            value={SETTINGS_MOBILE_APPEARANCE_SYSTEM}
            disabled
            onClick={() => undefined}
            trailing={
              <span className="text-[10px] font-bold uppercase text-neutral-400">
                {SETTINGS_MOBILE_SOON}
              </span>
            }
          />
          <Row
            label={SETTINGS_MOBILE_ACCESSIBILITY}
            disabled
            onClick={() => undefined}
            trailing={
              <span className="text-[10px] font-bold uppercase text-neutral-400">
                {SETTINGS_MOBILE_SOON}
              </span>
            }
          />
        </div>
      </Card>

      <Card
        id="data"
        title={SETTINGS_MOBILE_CARD_DATA}
        iconClass="bg-slate-100 text-slate-700"
        icon={<FileLock2 className="h-4 w-4" aria-hidden />}
      >
        <div className="divide-y divide-neutral-100">
          <Row
            label={SETTINGS_MOBILE_BLOCKED}
            disabled
            onClick={() => undefined}
            trailing={
              <span className="text-[10px] font-bold uppercase text-neutral-400">
                {SETTINGS_MOBILE_SOON}
              </span>
            }
          />
          <Row
            label={SETTINGS_MOBILE_EXPORT}
            disabled
            onClick={() => undefined}
            trailing={
              <span className="text-[10px] font-bold uppercase text-neutral-400">
                {SETTINGS_MOBILE_SOON}
              </span>
            }
          />
        </div>
      </Card>

      <button
        type="button"
        onClick={() => onNavigate("help")}
        className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 text-left shadow-sm"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <HelpCircle className="h-4 w-4" aria-hidden />
        </span>
        <span className="flex-1 text-sm font-semibold text-neutral-900">
          {SETTINGS_MOBILE_HELP_SUPPORT}
        </span>
        <ChevronRight className="h-4 w-4 text-neutral-300" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => onNavigate("about")}
        className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 text-left shadow-sm"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <span className="flex-1 text-sm font-semibold text-neutral-900">{SETTINGS_MOBILE_ABOUT}</span>
        <ChevronRight className="h-4 w-4 text-neutral-300" aria-hidden />
      </button>

      <div className="space-y-2.5 pt-1">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3.5 text-sm font-semibold text-neutral-900"
        >
          {SETTINGS_MOBILE_LOGOUT}
        </button>
        <button
          type="button"
          disabled
          title={SETTINGS_MOBILE_SOON}
          className="w-full rounded-2xl border border-red-300 bg-white px-4 py-3.5 text-sm font-semibold text-red-600 opacity-80"
        >
          {SETTINGS_MOBILE_DELETE}
        </button>
        <p className="px-1 text-center text-xs leading-relaxed text-neutral-500">
          {SETTINGS_MOBILE_DELETE_HINT}
        </p>
      </div>
    </div>
  );
}
