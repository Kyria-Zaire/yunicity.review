"use client";

import {
  PROFILE_EDIT_CANCEL,
  PROFILE_EDIT_DESKTOP_SAVE_DISABLED_HINT,
  PROFILE_EDIT_SAVE,
  PROFILE_EDIT_SAVING,
} from "@yunicity/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";

type ProfileEditMobileActionBarProps = {
  formId: string;
  isDirty: boolean;
  isSaving: boolean;
};

/** Barre sticky Annuler / Enregistrer — maquette mobile. */
export function ProfileEditMobileActionBar({ formId, isDirty, isSaving }: ProfileEditMobileActionBarProps) {
  return (
    <div className="profile-edit-mobile-action-bar" data-profile-edit-mobile-action-bar="">
      <div className="flex items-center gap-2 px-3 py-3">
        <Link
          href="/profile/me"
          className="inline-flex min-h-[2.75rem] flex-[0.35] items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
        >
          {PROFILE_EDIT_CANCEL}
        </Link>
        <button
          type="submit"
          form={formId}
          disabled={isSaving || !isDirty}
          title={!isDirty && !isSaving ? PROFILE_EDIT_DESKTOP_SAVE_DISABLED_HINT : undefined}
          className="inline-flex min-h-[2.75rem] flex-[0.65] items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isSaving ? PROFILE_EDIT_SAVING : PROFILE_EDIT_SAVE}
        </button>
      </div>
    </div>
  );
}
