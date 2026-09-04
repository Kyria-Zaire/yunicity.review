"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { ProfileEditDesktopInterests } from "@/components/profile/edit/desktop/profile-edit-desktop-interests";
import type { ProfileMe } from "@yunicity/types";
import type { ProfileEditDraft } from "@yunicity/utils";
import {
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
  PROFILE_DESKTOP_BADGE_CITIZEN,
  PROFILE_EDIT_AVATAR_REMOVE,
  PROFILE_EDIT_BIO,
  PROFILE_EDIT_BIO_MAX_LENGTH,
  PROFILE_EDIT_CANCEL,
  PROFILE_EDIT_CITY,
  PROFILE_EDIT_DESKTOP_ADDRESS_PRIVACY,
  PROFILE_EDIT_DESKTOP_AVATAR_CHANGE,
  PROFILE_EDIT_DESKTOP_BANNER_CHANGE,
  PROFILE_EDIT_DESKTOP_DISPLAY_NAME,
  PROFILE_EDIT_DESKTOP_MEDIA_AUTO_SAVE,
  PROFILE_EDIT_DESKTOP_MEDIA_FORMAT,
  PROFILE_EDIT_DESKTOP_NEIGHBORHOOD,
  PROFILE_EDIT_DESKTOP_NEIGHBORHOOD_UNDEFINED,
  PROFILE_EDIT_DESKTOP_PHOTOS_TITLE,
  PROFILE_EDIT_DESKTOP_PROFILE_TYPE,
  PROFILE_EDIT_DESKTOP_PROFILE_TYPE_HINT,
  PROFILE_EDIT_DESKTOP_PUBLIC_TITLE,
  PROFILE_EDIT_DESKTOP_VISIBILITY_MANAGE,
  PROFILE_EDIT_DESKTOP_VISIBILITY_NEIGHBORHOOD,
  PROFILE_EDIT_DESKTOP_VISIBILITY_NEIGHBORHOOD_HINT,
  PROFILE_EDIT_DESKTOP_VISIBILITY_PUBLIC,
  PROFILE_EDIT_DESKTOP_VISIBILITY_PUBLIC_HINT,
  PROFILE_EDIT_DESKTOP_VISIBILITY_TITLE,
  PROFILE_EDIT_SAVE,
  PROFILE_EDIT_SAVED,
  PROFILE_EDIT_SAVING,
  PROFILE_EDIT_UPLOADING,
  PROFILE_EDIT_USERNAME,
  PROFILE_EDIT_USERNAME_HINT,
  joinDisplayName,
  splitDisplayName,
} from "@yunicity/utils";
import { Camera, Loader2, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, type ChangeEvent, type FormEvent } from "react";

type ProfileEditDesktopFormProps = {
  profile: ProfileMe;
  draft: ProfileEditDraft;
  isDirty: boolean;
  isSaving: boolean;
  isUploadingAvatar: boolean;
  isUploadingBanner: boolean;
  saveMessage: string | null;
  saveMessageIsError?: boolean;
  formId?: string;
  layout?: "desktop" | "medium" | "mobile";
  hideInlineActions?: boolean;
  onDraftChange: (patch: Partial<ProfileEditDraft>) => void;
  onSave: () => Promise<void>;
  onAvatarFile: (file: File) => Promise<void>;
  onBannerFile: (file: File) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
  onSavedMessage: (message: string) => void;
};

function hiddenImageInput(
  onPick: (file: File) => void,
): (event: ChangeEvent<HTMLInputElement>) => void {
  return (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPick(file);
  };
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-neutral-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-yunicity-primary" : "bg-neutral-200"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-[1.35rem]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/** Formulaire édition profil desktop — maquette 3 colonnes. */
export function ProfileEditDesktopForm({
  profile,
  draft,
  isDirty,
  isSaving,
  isUploadingAvatar,
  isUploadingBanner,
  saveMessage,
  saveMessageIsError = false,
  formId = "profile-edit-desktop-form",
  layout = "desktop",
  hideInlineActions = false,
  onDraftChange,
  onSave,
  onAvatarFile,
  onBannerFile,
  onRemoveAvatar,
  onSavedMessage,
}: ProfileEditDesktopFormProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bannerUrl = profile.banner_url?.trim() || null;
  const displayName = joinDisplayName(draft.firstName, draft.lastName) ?? "";
  const bioLength = draft.bio.length;
  const cityOptions = Array.from(new Set([draft.city.trim(), "Reims", profile.city?.trim()].filter(Boolean)));
  const isCompact = layout === "medium" || layout === "mobile";
  const sectionPadding = isCompact ? "px-4 py-3" : "px-6 py-4";
  const bodyPadding = isCompact ? "px-4 pb-4" : "px-6 pb-6";
  const publicInfoGridClass =
    layout === "mobile"
      ? "mt-4 grid gap-4"
      : layout === "medium"
        ? "mt-5 grid gap-4 md:grid-cols-2"
        : "mt-5 grid gap-4 lg:grid-cols-2";
  const formSpacing = layout === "mobile" ? "space-y-4" : "space-y-6";
  const bannerButtonClass =
    layout === "mobile"
      ? "absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-xl border border-white/40 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-60"
      : "absolute right-4 top-4 inline-flex items-center gap-2 rounded-xl border border-white/40 bg-black/45 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-60";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSave();
    onSavedMessage(PROFILE_EDIT_SAVED);
  }

  return (
    <form
      id={formId}
      onSubmit={(event) => void handleSubmit(event)}
      className={`min-w-0 ${formSpacing}`}
      data-profile-edit-desktop-form=""
    >
      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <h2 className={`border-b border-neutral-100 text-base font-bold text-neutral-900 ${sectionPadding}`}>
          {PROFILE_EDIT_DESKTOP_PHOTOS_TITLE}
        </h2>
        <div className={`relative ${layout === "mobile" ? "min-h-[9rem]" : "min-h-[11rem]"} bg-neutral-200`}>
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={bannerUrl}
              src={bannerUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <CulturalImage
              src={NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL}
              alt=""
              placeName={draft.city || "Reims"}
              className="absolute inset-0 size-full"
              imageClassName="object-cover"
              sizes="720px"
              showFallbackCaption={false}
              overlay={false}
            />
          )}
          <button
            type="button"
            disabled={isUploadingBanner}
            onClick={() => bannerInputRef.current?.click()}
            className={bannerButtonClass}
          >
            {isUploadingBanner ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="h-4 w-4" aria-hidden />
            )}
            {isUploadingBanner ? PROFILE_EDIT_UPLOADING : PROFILE_EDIT_DESKTOP_BANNER_CHANGE}
          </button>
        </div>

        <div className={`relative ${bodyPadding} pt-12`}>
          <div
            className={`absolute ${layout === "mobile" ? "-top-8 left-4 h-16 w-16" : "-top-10 left-6 h-20 w-20"} overflow-hidden rounded-full border-[3px] border-white bg-yunicity-primary shadow-md`}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-xl font-bold text-white">
                {(displayName || profile.username).slice(0, 1).toUpperCase()}
              </span>
            )}
            {layout === "mobile" ? (
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-yunicity-primary text-white shadow"
                aria-label={PROFILE_EDIT_DESKTOP_AVATAR_CHANGE}
              >
                <Camera className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-yunicity-primary/40 bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]/60 disabled:opacity-60"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Camera className="h-4 w-4" aria-hidden />
              )}
              {isUploadingAvatar ? PROFILE_EDIT_UPLOADING : PROFILE_EDIT_DESKTOP_AVATAR_CHANGE}
            </button>
            {profile.avatar_url ? (
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => void onRemoveAvatar()}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {PROFILE_EDIT_AVATAR_REMOVE}
              </button>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-neutral-500">{PROFILE_EDIT_DESKTOP_MEDIA_FORMAT}</p>
          <p className="mt-1 text-xs font-medium text-emerald-700">{PROFILE_EDIT_DESKTOP_MEDIA_AUTO_SAVE}</p>
          {saveMessage && !saveMessageIsError ? (
            <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800" role="status">
              {saveMessage}
            </p>
          ) : null}
        </div>

        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={hiddenImageInput((file) => void onAvatarFile(file))}
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={hiddenImageInput((file) => void onBannerFile(file))}
        />
      </section>

      <section
        id="profile-edit-public"
        className={`scroll-mt-24 rounded-2xl border border-neutral-200/90 bg-white shadow-sm ${isCompact ? "p-4" : "p-6"}`}
      >
        <h2 className="text-base font-bold text-neutral-900">{PROFILE_EDIT_DESKTOP_PUBLIC_TITLE}</h2>

        <div className={publicInfoGridClass}>
          <label className="block">
            <span className="text-sm font-semibold text-neutral-800">
              {PROFILE_EDIT_DESKTOP_DISPLAY_NAME}
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => {
                const parts = splitDisplayName(event.target.value);
                onDraftChange(parts);
              }}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none ring-yunicity-primary/30 focus:border-yunicity-primary focus:ring-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-800">{PROFILE_EDIT_USERNAME}</span>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                @
              </span>
              <input
                type="text"
                readOnly
                value={profile.username}
                className="w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-8 pr-3 text-sm text-neutral-600"
              />
            </div>
            <span className="mt-1.5 block text-xs text-neutral-500">{PROFILE_EDIT_USERNAME_HINT}</span>
          </label>

          <div className="block">
            <span className="text-sm font-semibold text-neutral-800">
              {PROFILE_EDIT_DESKTOP_PROFILE_TYPE}
            </span>
            <div className="mt-1.5 flex min-h-[2.75rem] items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3">
              <span className="inline-flex rounded-md bg-[#EEF0FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yunicity-primary">
                {PROFILE_DESKTOP_BADGE_CITIZEN}
              </span>
            </div>
            <span className="mt-1.5 block text-xs text-neutral-500">
              {PROFILE_EDIT_DESKTOP_PROFILE_TYPE_HINT}
            </span>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-800">{PROFILE_EDIT_CITY}</span>
            <select
              value={draft.city}
              onChange={(event) => onDraftChange({ city: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-yunicity-primary/30 focus:border-yunicity-primary focus:ring-2"
            >
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className={`block ${layout === "mobile" ? "" : layout === "medium" ? "md:col-span-2" : "lg:col-span-2"}`}>
            <span className="text-sm font-semibold text-neutral-800">
              {PROFILE_EDIT_DESKTOP_NEIGHBORHOOD}
            </span>
            <select
              disabled
              value=""
              className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500"
            >
              <option value="">{PROFILE_EDIT_DESKTOP_NEIGHBORHOOD_UNDEFINED}</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-neutral-800">{PROFILE_EDIT_BIO}</span>
          <textarea
            value={draft.bio}
            maxLength={PROFILE_EDIT_BIO_MAX_LENGTH}
            rows={4}
            onChange={(event) => onDraftChange({ bio: event.target.value })}
            className="mt-1.5 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none ring-yunicity-primary/30 focus:border-yunicity-primary focus:ring-2"
          />
          <span className="mt-1 block text-right text-xs text-neutral-500">
            {bioLength}/{PROFILE_EDIT_BIO_MAX_LENGTH}
          </span>
        </label>

        <p className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
          <Shield className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
          {PROFILE_EDIT_DESKTOP_ADDRESS_PRIVACY}
        </p>
      </section>

      <ProfileEditDesktopInterests draft={draft} onDraftChange={onDraftChange} compact={isCompact} />

      <section className={`rounded-2xl border border-neutral-200/90 bg-white shadow-sm ${isCompact ? "p-4" : "p-6"}`}>
        <h2 className="text-base font-bold text-neutral-900">{PROFILE_EDIT_DESKTOP_VISIBILITY_TITLE}</h2>
        <div className="mt-5 space-y-5 divide-y divide-neutral-100">
          <Toggle
            checked={draft.visibility === "public"}
            onChange={(next) => onDraftChange({ visibility: next ? "public" : "private" })}
            label={PROFILE_EDIT_DESKTOP_VISIBILITY_PUBLIC}
            description={PROFILE_EDIT_DESKTOP_VISIBILITY_PUBLIC_HINT}
          />
          <div className="pt-5">
            <Toggle
              checked={false}
              onChange={() => undefined}
              disabled
              label={PROFILE_EDIT_DESKTOP_VISIBILITY_NEIGHBORHOOD}
              description={PROFILE_EDIT_DESKTOP_VISIBILITY_NEIGHBORHOOD_HINT}
            />
          </div>
        </div>
        <Link
          href="/settings#privacy"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          <Shield className="h-4 w-4" aria-hidden />
          {PROFILE_EDIT_DESKTOP_VISIBILITY_MANAGE}
        </Link>
      </section>

      {!hideInlineActions ? (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/profile/me"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
          >
            {PROFILE_EDIT_CANCEL}
          </Link>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {isSaving ? PROFILE_EDIT_SAVING : PROFILE_EDIT_SAVE}
          </button>
        </div>
      ) : null}

      {saveMessage && !hideInlineActions ? (
        <p
          className={`text-center text-sm font-medium ${
            saveMessageIsError ? "text-red-700" : "text-emerald-700"
          }`}
          role="status"
        >
          {saveMessage}
        </p>
      ) : null}
    </form>
  );
}
