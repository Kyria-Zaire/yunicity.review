"use client";

import { ProfileEditForm } from "@/components/profile/edit/profile-edit-form";
import { ProfileEditPreviewRail } from "@/components/profile/edit/profile-edit-preview-rail";
import { ProfileEditTabs } from "@/components/profile/edit/profile-edit-tabs";
import { ProfileEditMobileCompletion } from "@/components/profile/mobile/profile-edit-mobile-completion";
import { ProfileEditMobileHeader } from "@/components/profile/mobile/profile-edit-mobile-header";
import type { ProfileMe } from "@yunicity/types";
import type {
  ProfileEditCompletionItem,
  ProfileEditDraft,
  ProfileEditPreviewView,
} from "@yunicity/utils";
import { PROFILE_EDIT_PAGE_SUBTITLE } from "@yunicity/utils";

type ProfileEditMobileViewProps = {
  profile: ProfileMe;
  draft: ProfileEditDraft;
  completion: { percent: number; items: ProfileEditCompletionItem[] };
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
  onRemoveBanner: () => Promise<void>;
  onSavedMessage: (message: string) => void;
};

/** Vue mobile édition profil (MOBILE-PROFILE-01). */
export function ProfileEditMobileView({
  profile,
  draft,
  completion,
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
  onRemoveBanner,
  onSavedMessage,
}: ProfileEditMobileViewProps) {
  return (
    <div className="web-mobile-profile-edit-only min-w-0 bg-[#F4F5F7] pb-24">
      <ProfileEditMobileHeader />

      <div className="space-y-4 px-4 pt-3">
        <p className="text-sm leading-relaxed text-neutral-600">{PROFILE_EDIT_PAGE_SUBTITLE}</p>

        <div className="-mx-4 overflow-x-auto px-4">
          <ProfileEditTabs variant="mobile" />
        </div>

        <ProfileEditMobileCompletion percent={completion.percent} items={completion.items} />

        <ProfileEditForm
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
          onRemoveBanner={onRemoveBanner}
          onSavedMessage={onSavedMessage}
        />

        <ProfileEditPreviewRail preview={preview} />
      </div>
    </div>
  );
}
