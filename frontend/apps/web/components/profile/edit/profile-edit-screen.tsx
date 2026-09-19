"use client";

import { ProfileEditMobileScreen } from "@/components/profile/edit/mobile";
import { ProfileEditMediumScreen } from "@/components/profile/edit/medium";
import { ProfileEditDesktopScreen } from "@/components/profile/edit/desktop";
import { ProfileAppShell } from "@/components/profile/profile-app-shell";
import { useProfileEditContext } from "@/hooks/use-profile-edit-context";
import {
  PROFILE_EDIT_ERROR,
  PROFILE_EDIT_LOADING,
  PROFILE_EDIT_RETRY,
} from "@yunicity/utils";

export function ProfileEditScreen() {
  const ctx = useProfileEditContext();

  if (ctx.loading) {
    return (
      <ProfileAppShell>
        <p
          className="web-mobile-profile-edit-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {PROFILE_EDIT_LOADING}
        </p>
        <p
          className="web-medium-profile-edit-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {PROFILE_EDIT_LOADING}
        </p>
        <p
          className="web-desktop-profile-edit-only px-4 py-12 text-center text-sm text-neutral-500"
          role="status"
        >
          {PROFILE_EDIT_LOADING}
        </p>
      </ProfileAppShell>
    );
  }

  if (ctx.error || !ctx.profile || !ctx.draft || !ctx.completion || !ctx.preview) {
    return (
      <ProfileAppShell>
        <div className="web-mobile-profile-edit-only mx-auto max-w-lg px-4 py-10">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm text-red-800">{PROFILE_EDIT_ERROR}</p>
            <button
              type="button"
              onClick={() => void ctx.reload()}
              className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {PROFILE_EDIT_RETRY}
            </button>
          </div>
        </div>
        <div className="web-medium-profile-edit-only mx-auto max-w-lg px-4 py-10">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm text-red-800">{PROFILE_EDIT_ERROR}</p>
            <button
              type="button"
              onClick={() => void ctx.reload()}
              className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {PROFILE_EDIT_RETRY}
            </button>
          </div>
        </div>
        <div className="web-desktop-profile-edit-only mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm text-red-800">{PROFILE_EDIT_ERROR}</p>
          <button
            type="button"
            onClick={() => void ctx.reload()}
            className="mt-4 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_EDIT_RETRY}
          </button>
        </div>
      </ProfileAppShell>
    );
  }

  return (
    <ProfileAppShell>
      <ProfileEditMobileScreen
        profile={ctx.profile}
        draft={ctx.draft}
        preview={ctx.preview}
        isDirty={ctx.isDirty}
        isSaving={ctx.isSaving}
        isUploadingAvatar={ctx.isUploadingAvatar}
        isUploadingBanner={ctx.isUploadingBanner}
        saveMessage={ctx.saveMessage}
        saveMessageIsError={ctx.saveMessageIsError}
        onDraftChange={ctx.updateDraft}
        onSave={async () => {
          await ctx.save();
        }}
        onAvatarFile={async (file) => {
          await ctx.uploadAvatar(file);
        }}
        onBannerFile={async (file) => {
          await ctx.uploadBanner(file);
        }}
        onRemoveAvatar={async () => {
          await ctx.removeAvatar();
        }}
        onSavedMessage={ctx.setSaveMessage}
      />
      <ProfileEditMediumScreen
        ctx={{
          ...ctx,
          profile: ctx.profile,
          draft: ctx.draft,
          preview: ctx.preview,
        }}
      />
      <ProfileEditDesktopScreen
        ctx={{
          ...ctx,
          profile: ctx.profile,
          draft: ctx.draft,
          preview: ctx.preview,
        }}
      />
    </ProfileAppShell>
  );
}
