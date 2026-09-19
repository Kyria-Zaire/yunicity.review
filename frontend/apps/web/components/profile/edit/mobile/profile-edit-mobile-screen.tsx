"use client";

import { ProfileEditDesktopForm } from "@/components/profile/edit/desktop/profile-edit-desktop-form";
import { ProfileEditMobileActionBar } from "@/components/profile/edit/mobile/profile-edit-mobile-action-bar";
import { ProfileEditMobileFooterLinks } from "@/components/profile/edit/mobile/profile-edit-mobile-footer-links";
import { ProfileEditMobilePreview } from "@/components/profile/edit/mobile/profile-edit-mobile-preview";
import { ProfileEditMobileTabBar } from "@/components/profile/edit/mobile/profile-edit-mobile-tab-bar";
import { ProfileEditMobileHeader } from "@/components/profile/mobile/profile-edit-mobile-header";
import type { ProfileMe } from "@yunicity/types";
import type { ProfileEditDraft, ProfileEditPreviewView } from "@yunicity/utils";

const MOBILE_FORM_ID = "profile-edit-mobile-form";

type ProfileEditMobileScreenProps = {
  profile: ProfileMe;
  draft: ProfileEditDraft;
  preview: ProfileEditPreviewView;
  isDirty: boolean;
  isSaving: boolean;
  isUploadingAvatar: boolean;
  isUploadingBanner: boolean;
  saveMessage: string | null;
  saveMessageIsError: boolean;
  onDraftChange: (patch: Partial<ProfileEditDraft>) => void;
  onSave: () => Promise<void>;
  onAvatarFile: (file: File) => Promise<void>;
  onBannerFile: (file: File) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
  onSavedMessage: (message: string) => void;
};

/** Écran édition profil mobile — ≤639 px, maquette MOBILE-PROFILE-EDIT-01. */
export function ProfileEditMobileScreen({
  profile,
  draft,
  preview,
  isDirty,
  isSaving,
  isUploadingAvatar,
  isUploadingBanner,
  saveMessage,
  saveMessageIsError,
  onDraftChange,
  onSave,
  onAvatarFile,
  onBannerFile,
  onRemoveAvatar,
  onSavedMessage,
}: ProfileEditMobileScreenProps) {
  return (
    <div
      className="web-mobile-profile-edit-only profile-edit-mobile-shell min-w-0 bg-[#F4F5F7]"
      data-profile-edit-mobile=""
    >
      <ProfileEditMobileHeader />

      {saveMessage ? (
        <p
          className={`mx-4 mt-3 rounded-xl px-4 py-3 text-sm font-medium ${
            saveMessageIsError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"
          }`}
          role="status"
        >
          {saveMessage}
        </p>
      ) : null}

      <div className="space-y-4 px-4 pb-4 pt-3">
        <ProfileEditMobileTabBar />

        <ProfileEditDesktopForm
          formId={MOBILE_FORM_ID}
          layout="mobile"
          hideInlineActions
          profile={profile}
          draft={draft}
          isDirty={isDirty}
          isSaving={isSaving}
          isUploadingAvatar={isUploadingAvatar}
          isUploadingBanner={isUploadingBanner}
          saveMessage={saveMessage}
          saveMessageIsError={saveMessageIsError}
          onDraftChange={onDraftChange}
          onSave={onSave}
          onAvatarFile={onAvatarFile}
          onBannerFile={onBannerFile}
          onRemoveAvatar={onRemoveAvatar}
          onSavedMessage={onSavedMessage}
        />

        <ProfileEditMobilePreview preview={preview} />
        <ProfileEditMobileFooterLinks />
      </div>

      <ProfileEditMobileActionBar formId={MOBILE_FORM_ID} isDirty={isDirty} isSaving={isSaving} />
    </div>
  );
}
