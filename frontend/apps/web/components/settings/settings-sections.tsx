"use client";

import { InterestPicker } from "@/components/interest-picker";
import type { AuthUser, ProfileMe, ProfileVisibility, PushSubscription, UserNotificationPreferences } from "@yunicity/types";
import {
  NOTIFICATIONS_PREF_OFFERS_HINT,
  NOTIFICATIONS_PREF_OFFERS_LABEL,
  NOTIFICATIONS_PREF_PASSPORT_HINT,
  NOTIFICATIONS_PREF_PASSPORT_LABEL,
  NOTIFICATIONS_PREF_SOCIAL_HINT,
  NOTIFICATIONS_PREF_SOCIAL_LABEL,
  SETTINGS_ABOUT_TAGLINE,
  SETTINGS_ABOUT_TITLE,
  SETTINGS_ABOUT_VERSION,
  SETTINGS_DELETE_BODY,
  SETTINGS_DELETE_TITLE,
  SETTINGS_DEVICE_REMOVE,
  SETTINGS_DEVICE_REMOVING,
  SETTINGS_DEVICES_EMPTY,
  SETTINGS_DEVICES_TITLE,
  SETTINGS_DEVICES_WEB_NOTE,
  SETTINGS_DISPLAY_LANGUAGE,
  SETTINGS_DISPLAY_THEME_NOTE,
  SETTINGS_DISPLAY_TITLE,
  SETTINGS_EXPORT_BODY,
  SETTINGS_EXPORT_TITLE,
  SETTINGS_HELP_BODY,
  SETTINGS_HELP_CTA,
  SETTINGS_HELP_TITLE,
  SETTINGS_LANGUAGE_OPTIONS,
  SETTINGS_PERSONAL_BIO,
  SETTINGS_PERSONAL_CITY,
  SETTINGS_PERSONAL_DISPLAY_NAME,
  SETTINGS_PERSONAL_EMAIL,
  SETTINGS_PERSONAL_SAVE,
  SETTINGS_PERSONAL_SAVED,
  SETTINGS_PERSONAL_SAVING,
  SETTINGS_PERSONAL_TITLE,
  SETTINGS_PERSONAL_USERNAME,
  SETTINGS_PERSONALIZATION_TITLE,
  SETTINGS_PRIVACY_TITLE,
  SETTINGS_SECURITY_BODY,
  SETTINGS_SECURITY_TITLE,
  SETTINGS_SOON,
  SETTINGS_VERIFICATION_TITLE,
  SETTINGS_VERIFICATION_SOON_BADGE,
  SETTINGS_VERIFICATION_UNVERIFIED_BODY,
  SETTINGS_VERIFICATION_VERIFIED_BODY,
  VISIBILITY_OPTIONS,
  formatPushDeviceLabel,
  formatSettingsDateTime,
  isAuthError,
  settingsSectionDomId,
  type SettingsVerificationView,
} from "@yunicity/utils";
import { BadgeCheck, Clock3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

type SettingsSectionsProps = {
  user: AuthUser | null;
  profile: ProfileMe;
  preferences: UserNotificationPreferences | null;
  pushDevices: PushSubscription[];
  verification: SettingsVerificationView;
  isSavingProfile: boolean;
  isSavingPrefs: boolean;
  removingDeviceId: string | null;
  onSaveProfile: (payload: {
    display_name?: string | null;
    bio?: string | null;
    city?: string | null;
    interests?: string[];
    visibility?: ProfileVisibility;
    preferred_language?: string | null;
  }) => Promise<ProfileMe>;
  onPreferenceChange: (key: keyof UserNotificationPreferences, value: boolean) => void;
  onRemoveDevice: (deviceId: string) => void;
};

function SectionCard({
  sectionId,
  title,
  children,
}: {
  sectionId: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={sectionId}
      className="scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function PrefToggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-neutral-100 px-4 py-3 hover:bg-neutral-50/80">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-neutral-900">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-neutral-500">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 text-yunicity-primary focus:ring-yunicity-primary"
      />
    </label>
  );
}

export function SettingsSections({
  user,
  profile,
  preferences,
  pushDevices,
  verification,
  isSavingProfile,
  isSavingPrefs,
  removingDeviceId,
  onSaveProfile,
  onPreferenceChange,
  onRemoveDevice,
}: SettingsSectionsProps) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<ProfileVisibility>("public");
  const [language, setLanguage] = useState("fr");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    setCity(profile.city ?? "");
    setInterests(profile.interests);
    setVisibility(profile.visibility);
    setLanguage(profile.preferred_language?.trim() || "fr");
  }, [profile]);

  async function saveProfileSettings() {
    setProfileMessage(null);
    setProfileError(null);
    try {
      await onSaveProfile({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        city: city.trim() || null,
        interests,
        visibility,
        preferred_language: language,
      });
      setProfileMessage(SETTINGS_PERSONAL_SAVED);
    } catch (err) {
      setProfileError(isAuthError(err) ? err.message : "Échec de la mise à jour.");
    }
  }

  async function handlePersonalSubmit(event: FormEvent) {
    event.preventDefault();
    await saveProfileSettings();
  }

  async function handleInlineSave() {
    await saveProfileSettings();
  }

  return (
    <div className="mt-10 space-y-6 border-t border-neutral-200/80 pt-10">
      {profileError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{profileError}</p>
      ) : null}
      {profileMessage ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{profileMessage}</p>
      ) : null}

      <SectionCard sectionId={settingsSectionDomId("personal")} title={SETTINGS_PERSONAL_TITLE}>
        <form onSubmit={(event) => void handlePersonalSubmit(event)} className="space-y-5">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-neutral-800">{SETTINGS_PERSONAL_EMAIL}</span>
            <input
              value={user?.email ?? ""}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-600"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-neutral-800">{SETTINGS_PERSONAL_USERNAME}</span>
            <input
              value={profile.username}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-600"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-neutral-800">{SETTINGS_PERSONAL_DISPLAY_NAME}</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-neutral-800">{SETTINGS_PERSONAL_BIO}</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-neutral-800">{SETTINGS_PERSONAL_CITY}</span>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
            />
          </label>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
          >
            {isSavingProfile ? SETTINGS_PERSONAL_SAVING : SETTINGS_PERSONAL_SAVE}
          </button>
        </form>
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("security")} title={SETTINGS_SECURITY_TITLE}>
        <p className="text-sm leading-relaxed text-neutral-600">{SETTINGS_SECURITY_BODY}</p>
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("verification")} title={SETTINGS_VERIFICATION_TITLE}>
        <div className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 p-4">
          {verification.verified ? (
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-neutral-500" aria-hidden />
          )}
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-neutral-900">{verification.verifiedLabel}</p>
              {!verification.verified ? (
                <span className="inline-flex rounded-full bg-neutral-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                  {SETTINGS_VERIFICATION_SOON_BADGE}
                </span>
              ) : null}
            </div>
            <p className="leading-relaxed text-neutral-600">
              {verification.verified
                ? SETTINGS_VERIFICATION_VERIFIED_BODY
                : SETTINGS_VERIFICATION_UNVERIFIED_BODY}
            </p>
            <p className="text-xs font-medium text-neutral-500">{verification.onboardingLabel}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("notifications")} title="Notifications">
        {preferences ? (
          <div className="space-y-2">
            <PrefToggle
              label={NOTIFICATIONS_PREF_SOCIAL_LABEL}
              hint={NOTIFICATIONS_PREF_SOCIAL_HINT}
              checked={preferences.social}
              disabled={isSavingPrefs}
              onChange={(value) => onPreferenceChange("social", value)}
            />
            <PrefToggle
              label={NOTIFICATIONS_PREF_PASSPORT_LABEL}
              hint={NOTIFICATIONS_PREF_PASSPORT_HINT}
              checked={preferences.passport}
              disabled={isSavingPrefs}
              onChange={(value) => onPreferenceChange("passport", value)}
            />
            <PrefToggle
              label={NOTIFICATIONS_PREF_OFFERS_LABEL}
              hint={NOTIFICATIONS_PREF_OFFERS_HINT}
              checked={preferences.offers}
              disabled={isSavingPrefs}
              onChange={(value) => onPreferenceChange("offers", value)}
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Préférences indisponibles pour le moment.</p>
        )}
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("display")} title={SETTINGS_DISPLAY_TITLE}>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-neutral-800">{SETTINGS_DISPLAY_LANGUAGE}</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
          >
            {SETTINGS_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-xs text-neutral-500">{SETTINGS_DISPLAY_THEME_NOTE}</p>
        <button
          type="button"
          onClick={() => void handleInlineSave()}
          disabled={isSavingProfile}
          className="mt-4 rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
        >
          {isSavingProfile ? SETTINGS_PERSONAL_SAVING : SETTINGS_PERSONAL_SAVE}
        </button>
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("privacy")} title={SETTINGS_PRIVACY_TITLE}>
        <fieldset className="space-y-2">
          <legend className="sr-only">{SETTINGS_PRIVACY_TITLE}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {VISIBILITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
                  visibility === option.value
                    ? "border-yunicity-primary bg-yunicity-primary text-white"
                    : "border-neutral-200 bg-white hover:border-yunicity-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="settings-visibility"
                  value={option.value}
                  checked={visibility === option.value}
                  onChange={() => setVisibility(option.value)}
                  className="sr-only"
                />
                <span className="font-medium">{option.label}</span>
                <span
                  className={`mt-1 block text-xs ${
                    visibility === option.value ? "text-white/80" : "text-neutral-500"
                  }`}
                >
                  {option.hint}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          onClick={() => void handleInlineSave()}
          disabled={isSavingProfile}
          className="mt-4 rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
        >
          {isSavingProfile ? SETTINGS_PERSONAL_SAVING : SETTINGS_PERSONAL_SAVE}
        </button>
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("personalization")} title={SETTINGS_PERSONALIZATION_TITLE}>
        <InterestPicker value={interests} onChange={setInterests} />
        <button
          type="button"
          onClick={() => void handleInlineSave()}
          disabled={isSavingProfile}
          className="mt-4 rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover disabled:opacity-60"
        >
          {isSavingProfile ? SETTINGS_PERSONAL_SAVING : SETTINGS_PERSONAL_SAVE}
        </button>
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("devices")} title={SETTINGS_DEVICES_TITLE}>
        <p className="mb-4 text-xs text-neutral-500">{SETTINGS_DEVICES_WEB_NOTE}</p>
        {pushDevices.length === 0 ? (
          <p className="text-sm text-neutral-600">{SETTINGS_DEVICES_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {pushDevices.map((device) => (
              <li
                key={device.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatPushDeviceLabel(device)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Dernière activité : {formatSettingsDateTime(device.last_seen_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveDevice(device.id)}
                  disabled={removingDeviceId === device.id}
                  className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
                >
                  {removingDeviceId === device.id ? SETTINGS_DEVICE_REMOVING : SETTINGS_DEVICE_REMOVE}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("export")} title={SETTINGS_EXPORT_TITLE}>
        <p className="text-sm leading-relaxed text-neutral-600">{SETTINGS_EXPORT_BODY}</p>
        <span className="mt-3 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
          {SETTINGS_SOON}
        </span>
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("delete")} title={SETTINGS_DELETE_TITLE}>
        <p className="text-sm leading-relaxed text-neutral-600">{SETTINGS_DELETE_BODY}</p>
        <span className="mt-3 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
          {SETTINGS_SOON}
        </span>
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("help")} title={SETTINGS_HELP_TITLE}>
        <p className="text-sm leading-relaxed text-neutral-600">{SETTINGS_HELP_BODY}</p>
        <Link
          href="/organizations/request"
          className="mt-4 inline-flex rounded-full bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
        >
          {SETTINGS_HELP_CTA}
        </Link>
      </SectionCard>

      <SectionCard sectionId={settingsSectionDomId("about")} title={SETTINGS_ABOUT_TITLE}>
        <p className="text-sm text-neutral-600">{SETTINGS_ABOUT_TAGLINE}</p>
        <p className="mt-3 text-sm font-medium text-neutral-800">
          {SETTINGS_ABOUT_VERSION} : 0.0.0
        </p>
      </SectionCard>
    </div>
  );
}
