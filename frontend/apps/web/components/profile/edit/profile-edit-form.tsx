"use client";

import { InterestPicker } from "@/components/interest-picker";
import { CulturalImage } from "@/components/culture/cultural-image";
import type { ProfileMe } from "@yunicity/types";
import type { ProfileEditDraft } from "@yunicity/utils";
import {
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
  PROFILE_EDIT_AVATAR_CHANGE,
  PROFILE_EDIT_AVATAR_REMOVE,
  PROFILE_EDIT_AVATAR_TIP,
  PROFILE_EDIT_AVATAR_TITLE,
  PROFILE_EDIT_BANNER_CHANGE,
  PROFILE_EDIT_BANNER_TIP,
  PROFILE_EDIT_BANNER_TITLE,
  PROFILE_EDIT_BIO,
  PROFILE_EDIT_BIO_MAX_LENGTH,
  PROFILE_EDIT_CANCEL,
  PROFILE_EDIT_CITY,
  PROFILE_EDIT_CITY_HINT,
  PROFILE_EDIT_FIRST_NAME,
  PROFILE_EDIT_INTERESTS_BODY,
  PROFILE_EDIT_INTERESTS_TITLE,
  PROFILE_EDIT_LAST_NAME,
  PROFILE_EDIT_PERSONAL_TITLE,
  PROFILE_EDIT_SAVE,
  PROFILE_EDIT_SAVED,
  PROFILE_EDIT_SAVING,
  PROFILE_EDIT_UPLOADING,
  PROFILE_EDIT_USERNAME,
  PROFILE_EDIT_USERNAME_HINT,
} from "@yunicity/utils";
import { Camera, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRef, type ChangeEvent, type FormEvent } from "react";

type ProfileEditFormProps = {
  profile: ProfileMe;
  draft: ProfileEditDraft;
  isDirty: boolean;
  isSaving: boolean;
  isUploadingAvatar: boolean;
  isUploadingBanner: boolean;
  saveMessage: string | null;
  saveMessageIsError?: boolean;
  onDraftChange: (patch: Partial<ProfileEditDraft>) => void;
  onSave: () => Promise<void>;
  onAvatarFile: (file: File) => Promise<void>;
  onBannerFile: (file: File) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
  onRemoveBanner: () => Promise<void>;
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

export function ProfileEditForm({
  profile,
  draft,
  isDirty,
  isSaving,
  isUploadingAvatar,
  isUploadingBanner,
  saveMessage,
  saveMessageIsError = false,
  onDraftChange,
  onSave,
  onAvatarFile,
  onBannerFile,
  onRemoveAvatar,
  onRemoveBanner,
  onSavedMessage,
}: ProfileEditFormProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bioLength = draft.bio.length;
  const bannerUrl = profile.banner_url?.trim() || null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSave();
    onSavedMessage(PROFILE_EDIT_SAVED);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-8">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">{PROFILE_EDIT_AVATAR_TITLE}</h2>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative h-24 w-24 shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="size-full rounded-full object-cover ring-2 ring-neutral-100"
              />
            ) : (
              <span className="flex size-full items-center justify-center rounded-full bg-yunicity-primary/10 text-2xl font-bold text-yunicity-primary">
                {(draft.firstName || profile.username).slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-yunicity-primary text-white shadow">
              <Camera className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-yunicity-primary/40 px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5 disabled:opacity-60"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {isUploadingAvatar ? PROFILE_EDIT_UPLOADING : PROFILE_EDIT_AVATAR_CHANGE}
              </button>
              {profile.avatar_url ? (
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => void onRemoveAvatar()}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  {PROFILE_EDIT_AVATAR_REMOVE}
                </button>
              ) : null}
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">{PROFILE_EDIT_AVATAR_TIP}</p>
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={hiddenImageInput((file) => void onAvatarFile(file))}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-6 py-4 text-base font-bold text-neutral-900">
          {PROFILE_EDIT_BANNER_TITLE}
        </h2>
        <div className="relative min-h-[140px] bg-neutral-900">
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
              sizes="(max-width: 768px) 100vw, 720px"
              showFallbackCaption={false}
              overlay={false}
            />
          )}
          <button
            type="button"
            disabled={isUploadingBanner}
            onClick={() => bannerInputRef.current?.click()}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-xl border border-white/40 bg-black/45 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-60"
          >
            {isUploadingBanner ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="h-4 w-4" aria-hidden />
            )}
            {isUploadingBanner ? PROFILE_EDIT_UPLOADING : PROFILE_EDIT_BANNER_CHANGE}
          </button>
          {bannerUrl ? (
            <button
              type="button"
              disabled={isUploadingBanner}
              onClick={() => void onRemoveBanner()}
              className="absolute bottom-4 left-4 rounded-xl bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/60"
            >
              {PROFILE_EDIT_AVATAR_REMOVE}
            </button>
          ) : null}
        </div>
        <p className="px-6 py-4 text-sm leading-relaxed text-neutral-500">{PROFILE_EDIT_BANNER_TIP}</p>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={hiddenImageInput((file) => void onBannerFile(file))}
        />
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">{PROFILE_EDIT_PERSONAL_TITLE}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-800">{PROFILE_EDIT_FIRST_NAME}</span>
            <input
              type="text"
              value={draft.firstName}
              onChange={(event) => onDraftChange({ firstName: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none ring-yunicity-primary/30 focus:border-yunicity-primary focus:ring-2"
              autoComplete="given-name"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-neutral-800">{PROFILE_EDIT_LAST_NAME}</span>
            <input
              type="text"
              value={draft.lastName}
              onChange={(event) => onDraftChange({ lastName: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none ring-yunicity-primary/30 focus:border-yunicity-primary focus:ring-2"
              autoComplete="family-name"
            />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-neutral-800">{PROFILE_EDIT_USERNAME}</span>
          <input
            type="text"
            readOnly
            value={`@${profile.username}`}
            className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600"
          />
          <span className="mt-1.5 block text-xs text-neutral-500">{PROFILE_EDIT_USERNAME_HINT}</span>
        </label>
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
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-neutral-800">{PROFILE_EDIT_CITY}</span>
          <span className="relative mt-1.5 block">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="text"
              value={draft.city}
              onChange={(event) => onDraftChange({ city: event.target.value })}
              className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-yunicity-primary/30 focus:border-yunicity-primary focus:ring-2"
              autoComplete="address-level2"
            />
          </span>
          <span className="mt-1.5 block text-xs text-neutral-500">{PROFILE_EDIT_CITY_HINT}</span>
        </label>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">{PROFILE_EDIT_INTERESTS_TITLE}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">{PROFILE_EDIT_INTERESTS_BODY}</p>
        <div className="mt-4">
          <InterestPicker
            value={draft.interests}
            onChange={(interests) => onDraftChange({ interests })}
          />
        </div>
      </section>

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

      {saveMessage ? (
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
