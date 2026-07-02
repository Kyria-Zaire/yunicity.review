"use client";

import { ProfileEditForm } from "@/components/profile/edit/profile-edit-form";
import { ProfileEditLeftRail } from "@/components/profile/edit/profile-edit-left-rail";
import { ProfileEditPreviewRail } from "@/components/profile/edit/profile-edit-preview-rail";
import { ProfileEditTabs } from "@/components/profile/edit/profile-edit-tabs";
import { ProfileAppShell } from "@/components/profile/profile-app-shell";
import { useProfileEditContext } from "@/hooks/use-profile-edit-context";
import {
  PROFILE_EDIT_ERROR,
  PROFILE_EDIT_LOADING,
  PROFILE_EDIT_PAGE_SUBTITLE,
  PROFILE_EDIT_PAGE_TITLE,
  PROFILE_EDIT_RETRY,
} from "@yunicity/utils";

export function ProfileEditScreen() {
  const ctx = useProfileEditContext();

  if (ctx.loading) {
    return (
      <ProfileAppShell>
        <p className="px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {PROFILE_EDIT_LOADING}
        </p>
      </ProfileAppShell>
    );
  }

  if (ctx.error || !ctx.profile || !ctx.draft || !ctx.completion || !ctx.preview) {
    return (
      <ProfileAppShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
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
      <div className="mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 lg:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {PROFILE_EDIT_PAGE_TITLE}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
            {PROFILE_EDIT_PAGE_SUBTITLE}
          </p>
          <div className="mt-6">
            <ProfileEditTabs />
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[14rem_minmax(0,1fr)_18rem]">
          <ProfileEditLeftRail
            percent={ctx.completion.percent}
            items={ctx.completion.items}
            tribeCards={ctx.tribeCards}
          />

          <div className="min-w-0">
            <ProfileEditForm
              profile={ctx.profile}
              draft={ctx.draft}
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
              onRemoveBanner={async () => {
                await ctx.removeBanner();
              }}
              onSavedMessage={ctx.setSaveMessage}
            />
          </div>

          <ProfileEditPreviewRail preview={ctx.preview} />
        </div>
      </div>
    </ProfileAppShell>
  );
}
