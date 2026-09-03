"use client";

import {
  PROFILE_EDIT_CANCEL,
  PROFILE_EDIT_DESKTOP_SAVE_DISABLED_HINT,
  PROFILE_EDIT_SAVE,
  PROFILE_EDIT_SAVING,
} from "@yunicity/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";

type ProfileEditMediumActionBarProps = {
  formId: string;
  isDirty: boolean;
  isSaving: boolean;
};

/** Barre d'actions sticky — Annuler / Enregistrer (maquette medium). */
export function ProfileEditMediumActionBar({ formId, isDirty, isSaving }: ProfileEditMediumActionBarProps) {
  return (
    <div className="profile-edit-medium-action-bar" data-profile-edit-medium-action-bar="">
      <div className="mx-auto flex max-w-[960px] items-center justify-end gap-3 px-3 py-3 sm:px-4">
        <Link
          href="/profile/me"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 sm:flex-none"
        >
          {PROFILE_EDIT_CANCEL}
        </Link>
        <button
          type="submit"
          form={formId}
          disabled={isSaving || !isDirty}
          title={!isDirty && !isSaving ? PROFILE_EDIT_DESKTOP_SAVE_DISABLED_HINT : undefined}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {isSaving ? PROFILE_EDIT_SAVING : PROFILE_EDIT_SAVE}
        </button>
      </div>
    </div>
  );
}
