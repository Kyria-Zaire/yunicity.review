"use client";

import { ProfileEditDesktopForm } from "@/components/profile/edit/desktop/profile-edit-desktop-form";
import { ProfileEditDesktopNavRail } from "@/components/profile/edit/desktop/profile-edit-desktop-nav-rail";
import { ProfileEditDesktopPageHeader } from "@/components/profile/edit/desktop/profile-edit-desktop-page-header";
import { ProfileEditDesktopPreviewRail } from "@/components/profile/edit/desktop/profile-edit-desktop-preview-rail";
import type { useProfileEditContext } from "@/hooks/use-profile-edit-context";

type ProfileEditCtx = ReturnType<typeof useProfileEditContext>;

type ProfileEditDesktopScreenProps = {
  ctx: ProfileEditCtx & {
    profile: NonNullable<ProfileEditCtx["profile"]>;
    draft: NonNullable<ProfileEditCtx["draft"]>;
    preview: NonNullable<ProfileEditCtx["preview"]>;
  };
};

/** Écran édition profil desktop — layout 3 colonnes maquette. */
export function ProfileEditDesktopScreen({ ctx }: ProfileEditDesktopScreenProps) {
  return (
    <div
      className="web-desktop-profile-edit-only mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 lg:px-6"
      data-profile-edit-desktop=""
    >
      <ProfileEditDesktopPageHeader
        isDirty={ctx.isDirty}
        isSaving={ctx.isSaving}
        saveMessage={ctx.saveMessage}
        saveMessageIsError={ctx.saveMessageIsError}
      />

      <div className="grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)_19rem] xl:gap-8">
        <ProfileEditDesktopNavRail profile={ctx.profile} preview={ctx.preview} />

        <ProfileEditDesktopForm
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

        <ProfileEditDesktopPreviewRail preview={ctx.preview} />
      </div>
    </div>
  );
}
