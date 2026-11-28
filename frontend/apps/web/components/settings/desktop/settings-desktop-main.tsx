"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import type { AuthUser, ProfileMe, ProfileVisibility, UserNotificationPreferences } from "@yunicity/types";
import {
  SETTINGS_DESKTOP_APPEARANCE,
  SETTINGS_DESKTOP_APPEARANCE_SYSTEM,
  SETTINGS_DESKTOP_BADGE_YUNICIZEN,
  SETTINGS_DESKTOP_CARD_ACCOUNT,
  SETTINGS_DESKTOP_CARD_ACTIONS,
  SETTINGS_DESKTOP_CARD_CITY,
  SETTINGS_DESKTOP_CARD_DISPLAY,
  SETTINGS_DESKTOP_CARD_NOTIFICATIONS,
  SETTINGS_DESKTOP_CARD_PRIVACY,
  SETTINGS_DESKTOP_DEFINE,
  SETTINGS_DESKTOP_DELETE,
  SETTINGS_DESKTOP_DELETE_SOON,
  SETTINGS_DESKTOP_EDIT_PROFILE,
  SETTINGS_DESKTOP_EMAIL,
  SETTINGS_DESKTOP_LANGUAGE,
  SETTINGS_DESKTOP_LOGOUT,
  SETTINGS_DESKTOP_MANAGE,
  SETTINGS_DESKTOP_MANAGE_ACCESSIBILITY,
  SETTINGS_DESKTOP_MANAGE_CITY,
  SETTINGS_DESKTOP_MANAGE_NOTIFICATIONS,
  SETTINGS_DESKTOP_MANAGE_PRIVACY,
  SETTINGS_DESKTOP_NEIGHBORHOOD,
  SETTINGS_DESKTOP_NEIGHBORHOOD_UNDEFINED,
  SETTINGS_DESKTOP_PREF_CONTRIBUTIONS,
  SETTINGS_DESKTOP_PREF_EVENTS,
  SETTINGS_DESKTOP_PREF_PASSPORT,
  SETTINGS_DESKTOP_PREF_TRIBES,
  SETTINGS_DESKTOP_PRECISE_LOCATION,
  SETTINGS_DESKTOP_PRECISE_LOCATION_HINT,
  SETTINGS_DESKTOP_PRIVACY_NEIGHBORHOOD,
  SETTINGS_DESKTOP_PRIVACY_POSITION,
  SETTINGS_DESKTOP_PRIVACY_PUBLIC,
  SETTINGS_DESKTOP_PROFILE_TYPE,
  SETTINGS_DESKTOP_SOON,
  SETTINGS_LANGUAGE_OPTIONS,
  SETTINGS_MEDIUM_DELETE_HINT,
  SETTINGS_MEDIUM_EMAIL_HINT,
  SETTINGS_MEDIUM_PROFILE_TYPE_HINT,
  VISIBILITY_OPTIONS,
  maskSettingsEmail,
  settingsDesktopPrivacySummary,
  settingsDesktopSectionDomId,
  settingsDesktopUsername,
} from "@yunicity/utils";
import {
  Award,
  Bell,
  CalendarDays,
  ChevronRight,
  Lock,
  MapPin,
  Palette,
  Pencil,
  PenLine,
  Shield,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

type SettingsDesktopMainProps = {
  user: AuthUser | null;
  profile: ProfileMe;
  displayName: string;
  preferences: UserNotificationPreferences | null;
  isSavingProfile: boolean;
  isSavingPrefs: boolean;
  /** desktop = hub 3 cols ; medium = carte compte maquette onglets. */
  variant?: "desktop" | "medium";
  sectionDomId?: (sectionId: string) => string;
  onSaveProfile: (payload: {
    visibility?: ProfileVisibility;
    preferred_language?: string | null;
    city?: string | null;
  }) => Promise<ProfileMe>;
  onPreferenceChange: (key: keyof UserNotificationPreferences, value: boolean) => void;
  onLogout: () => void;
};

function CardShell({
  id,
  sectionDomId,
  children,
  className = "",
}: {
  id: string;
  sectionDomId: (sectionId: string) => string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={sectionDomId(id)}
      className={`scroll-mt-28 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
    >
      {label}
      <ChevronRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}

function FooterButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
    >
      {label}
      <ChevronRight className="h-4 w-4" aria-hidden />
    </button>
  );
}

function PreciseLocationToggle() {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900">{SETTINGS_DESKTOP_PRECISE_LOCATION}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
          {SETTINGS_DESKTOP_PRECISE_LOCATION_HINT}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={SETTINGS_DESKTOP_PRECISE_LOCATION}
        onClick={() => setEnabled((v) => !v)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
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
  );
}

const PREF_CHIPS = [
  { key: "social" as const, label: SETTINGS_DESKTOP_PREF_EVENTS, icon: CalendarDays },
  { key: "social" as const, label: SETTINGS_DESKTOP_PREF_TRIBES, icon: Users },
  { key: "passport" as const, label: SETTINGS_DESKTOP_PREF_PASSPORT, icon: Award },
  { key: "offers" as const, label: SETTINGS_DESKTOP_PREF_CONTRIBUTIONS, icon: PenLine },
];

export function SettingsDesktopMain({
  user,
  profile,
  displayName,
  preferences,
  isSavingProfile,
  isSavingPrefs,
  variant = "desktop",
  sectionDomId = settingsDesktopSectionDomId,
  onSaveProfile,
  onPreferenceChange,
  onLogout,
}: SettingsDesktopMainProps) {
  const isMedium = variant === "medium";
  const username = settingsDesktopUsername(profile);
  const emailMasked = maskSettingsEmail(user?.email);
  const privacy = settingsDesktopPrivacySummary(profile.visibility);
  const [showPrivacyEditor, setShowPrivacyEditor] = useState(false);
  const [showCityEditor, setShowCityEditor] = useState(false);
  const [cityDraft, setCityDraft] = useState(profile.city ?? "");
  const fieldPrefix = isMedium ? "settings-medium" : "settings-desktop";

  return (
    <div
      className="flex min-w-0 flex-col gap-4"
      data-settings-desktop-main=""
      data-settings-main-variant={variant}
    >
      <CardShell id="account" sectionDomId={sectionDomId}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ProfileAvatar name={displayName} src={profile.avatar_url} size="sm" />
            <div className="min-w-0">
              {!isMedium ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {SETTINGS_DESKTOP_CARD_ACCOUNT}
                </p>
              ) : null}
              <p className="truncate text-base font-bold text-neutral-900">{displayName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="truncate text-sm text-neutral-500">
                  {isMedium ? emailMasked : username}
                </span>
                <span className="inline-flex rounded-full bg-yunicity-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {SETTINGS_DESKTOP_BADGE_YUNICIZEN}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/profile/me/edit"
            className="inline-flex items-center gap-1.5 rounded-xl border border-yunicity-primary/35 px-3 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {SETTINGS_DESKTOP_EDIT_PROFILE}
          </Link>
        </div>

        <div className="mt-5 divide-y divide-neutral-100 border-t border-neutral-100">
          <div className="flex items-center justify-between gap-3 py-3.5">
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">{SETTINGS_DESKTOP_EMAIL}</p>
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-900">{emailMasked}</p>
              {isMedium ? (
                <p className="mt-0.5 text-xs text-neutral-500">{SETTINGS_MEDIUM_EMAIL_HINT}</p>
              ) : null}
            </div>
            {!isMedium ? (
              <button
                type="button"
                disabled
                title={SETTINGS_DESKTOP_SOON}
                className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-400"
              >
                {SETTINGS_DESKTOP_MANAGE}
              </button>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3 py-3.5">
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">{SETTINGS_DESKTOP_PROFILE_TYPE}</p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                {SETTINGS_DESKTOP_BADGE_YUNICIZEN}
              </p>
              {isMedium ? (
                <p className="mt-0.5 text-xs text-neutral-500">{SETTINGS_MEDIUM_PROFILE_TYPE_HINT}</p>
              ) : null}
            </div>
            {isMedium ? (
              <button
                type="button"
                disabled
                title={SETTINGS_DESKTOP_SOON}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-500"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden />
                {SETTINGS_DESKTOP_MANAGE}
              </button>
            ) : (
              <Lock className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            )}
          </div>
        </div>
      </CardShell>

      <CardShell id="city" sectionDomId={sectionDomId}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-yunicity-primary">
            <MapPin className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-neutral-900">{SETTINGS_DESKTOP_CARD_CITY}</h2>
            <p className="mt-1 text-lg font-semibold text-neutral-950">
              {profile.city?.trim() || "—"}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4 border-t border-neutral-100 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">{SETTINGS_DESKTOP_NEIGHBORHOOD}</p>
              <p className="text-sm text-neutral-500">{SETTINGS_DESKTOP_NEIGHBORHOOD_UNDEFINED}</p>
            </div>
            <Link
              href="/profile/me/edit"
              className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800 transition hover:border-yunicity-primary/40 hover:text-yunicity-primary"
            >
              {SETTINGS_DESKTOP_DEFINE}
            </Link>
          </div>
          <PreciseLocationToggle />
        </div>

        {showCityEditor ? (
          <div className="mt-4 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <label className="block text-xs font-semibold text-neutral-600" htmlFor={`${fieldPrefix}-city`}>
              {SETTINGS_DESKTOP_CARD_CITY}
            </label>
            <input
              id={`${fieldPrefix}-city`}
              value={cityDraft}
              onChange={(e) => setCityDraft(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-yunicity-primary focus:ring-1 focus:ring-yunicity-primary"
            />
            <button
              type="button"
              disabled={isSavingProfile}
              onClick={() => {
                void onSaveProfile({ city: cityDraft.trim() || null }).then(() => setShowCityEditor(false));
              }}
              className="rounded-xl bg-yunicity-primary px-3 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover disabled:opacity-60"
            >
              Enregistrer
            </button>
          </div>
        ) : null}

        <FooterButton
          label={SETTINGS_DESKTOP_MANAGE_CITY}
          onClick={() => {
            setCityDraft(profile.city ?? "");
            setShowCityEditor((v) => !v);
          }}
        />
      </CardShell>

      <CardShell id="privacy" sectionDomId={sectionDomId}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Shield className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-neutral-900">{SETTINGS_DESKTOP_CARD_PRIVACY}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-neutral-500">{SETTINGS_DESKTOP_PRIVACY_PUBLIC}</p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    privacy.publicProfile === "Activé" ? "text-emerald-600" : "text-neutral-500"
                  }`}
                >
                  {privacy.publicProfile}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">{SETTINGS_DESKTOP_PRIVACY_NEIGHBORHOOD}</p>
                <p className="mt-1 text-sm font-semibold text-neutral-500">{privacy.neighborhoodVisible}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">{SETTINGS_DESKTOP_PRIVACY_POSITION}</p>
                <p className="mt-1 text-sm font-semibold text-neutral-500">{privacy.sharedPosition}</p>
              </div>
            </div>
          </div>
        </div>

        {showPrivacyEditor ? (
          <div className="mt-4 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            {VISIBILITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 hover:bg-white"
              >
                <input
                  type="radio"
                  name={`${fieldPrefix}-visibility`}
                  className="mt-1"
                  checked={profile.visibility === option.value}
                  disabled={isSavingProfile}
                  onChange={() => void onSaveProfile({ visibility: option.value })}
                />
                <span>
                  <span className="block text-sm font-medium text-neutral-900">{option.label}</span>
                  <span className="block text-xs text-neutral-500">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        ) : null}

        <FooterButton
          label={SETTINGS_DESKTOP_MANAGE_PRIVACY}
          onClick={() => setShowPrivacyEditor((v) => !v)}
        />
      </CardShell>

      <CardShell id="notifications" sectionDomId={sectionDomId}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
            <Bell className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-neutral-900">{SETTINGS_DESKTOP_CARD_NOTIFICATIONS}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
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
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                      active
                        ? "border-yunicity-primary/40 bg-[#EEF0FF] text-yunicity-primary"
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <FooterLink href="/notifications" label={SETTINGS_DESKTOP_MANAGE_NOTIFICATIONS} />
      </CardShell>

      <CardShell id="display" sectionDomId={sectionDomId}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Palette className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-neutral-900">{SETTINGS_DESKTOP_CARD_DISPLAY}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
                  {SETTINGS_DESKTOP_LANGUAGE}
                </span>
                <select
                  value={profile.preferred_language ?? "fr"}
                  disabled={isSavingProfile}
                  onChange={(e) => void onSaveProfile({ preferred_language: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-yunicity-primary focus:ring-1 focus:ring-yunicity-primary"
                >
                  {SETTINGS_LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-neutral-500">
                  {SETTINGS_DESKTOP_APPEARANCE}
                </span>
                <select
                  disabled
                  value="system"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500"
                  title={SETTINGS_DESKTOP_SOON}
                >
                  <option value="system">{SETTINGS_DESKTOP_APPEARANCE_SYSTEM}</option>
                </select>
              </label>
            </div>
          </div>
        </div>
        <FooterButton
          label={SETTINGS_DESKTOP_MANAGE_ACCESSIBILITY}
          onClick={() => undefined}
        />
        <span className="sr-only">{SETTINGS_DESKTOP_SOON}</span>
      </CardShell>

      <CardShell id="actions" sectionDomId={sectionDomId}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <UserRound className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-neutral-900">{SETTINGS_DESKTOP_CARD_ACTIONS}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
              >
                {SETTINGS_DESKTOP_LOGOUT}
              </button>
              <button
                type="button"
                disabled
                title={SETTINGS_DESKTOP_DELETE_SOON}
                className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 opacity-70"
              >
                {SETTINGS_DESKTOP_DELETE}
              </button>
            </div>
            {isMedium ? (
              <p className="mt-3 text-xs leading-relaxed text-neutral-500">{SETTINGS_MEDIUM_DELETE_HINT}</p>
            ) : null}
          </div>
        </div>
      </CardShell>
    </div>
  );
}
