"use client";

import { ProfileEditDesktopForm } from "@/components/profile/edit/desktop/profile-edit-desktop-form";
import { ProfileEditMediumActionBar } from "@/components/profile/edit/medium/profile-edit-medium-action-bar";
import { ProfileEditMediumPageHeader } from "@/components/profile/edit/medium/profile-edit-medium-page-header";
import { ProfileEditMediumPreviewRail } from "@/components/profile/edit/medium/profile-edit-medium-preview-rail";
import { ProfileEditMediumTabBar } from "@/components/profile/edit/medium/profile-edit-medium-tab-bar";
import type { useProfileEditContext } from "@/hooks/use-profile-edit-context";

const MEDIUM_FORM_ID = "profile-edit-medium-form";

type ProfileEditCtx = ReturnType<typeof useProfileEditContext>;

type ProfileEditMediumScreenProps = {
  ctx: ProfileEditCtx & {
    profile: NonNullable<ProfileEditCtx["profile"]>;
    draft: NonNullable<ProfileEditCtx["draft"]>;
    preview: NonNullable<ProfileEditCtx["preview"]>;
  };
};

/** Écran édition profil medium — 640 → 1023 px, rail citoyen + 2 colonnes maquette. */
export function ProfileEditMediumScreen({ ctx }: ProfileEditMediumScreenProps) {
  return (
    <div
      className="web-medium-profile-edit-only profile-edit-medium-shell pb-24"
      data-profile-edit-medium=""
    >
      <div className="mx-auto w-full max-w-[960px] px-3 pt-2 sm:px-4 sm:pt-3">
        <ProfileEditMediumPageHeader
          isDirty={ctx.isDirty}
          isSaving={ctx.isSaving}
          saveMessage={ctx.saveMessage}
          saveMessageIsError={ctx.saveMessageIsError}
          formId={MEDIUM_FORM_ID}
        />

        <ProfileEditMediumTabBar />

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_17.5rem] md:items-start md:gap-6">
          <ProfileEditDesktopForm
            formId={MEDIUM_FORM_ID}
            layout="medium"
            hideInlineActions
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
            onSavedMessage={ctx.setSaveMessage}
          />

          <ProfileEditMediumPreviewRail preview={ctx.preview} />
        </div>
      </div>

      <ProfileEditMediumActionBar
        formId={MEDIUM_FORM_ID}
        isDirty={ctx.isDirty}
        isSaving={ctx.isSaving}
      />
    </div>
  );
}
