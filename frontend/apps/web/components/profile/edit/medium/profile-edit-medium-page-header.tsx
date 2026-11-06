"use client";

import {
  PROFILE_EDIT_CANCEL,
  PROFILE_EDIT_DESKTOP_BREADCRUMB_EDIT,
  PROFILE_EDIT_DESKTOP_BREADCRUMB_PROFILE,
  PROFILE_EDIT_DESKTOP_SAVE_DISABLED_HINT,
  PROFILE_EDIT_PAGE_SUBTITLE,
  PROFILE_EDIT_PAGE_TITLE,
  PROFILE_EDIT_SAVE,
  PROFILE_EDIT_SAVING,
} from "@yunicity/utils";
import { ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

type ProfileEditMediumPageHeaderProps = {
  isDirty: boolean;
  isSaving: boolean;
  saveMessage?: string | null;
  saveMessageIsError?: boolean;
  formId: string;
};

/** En-tête édition profil medium — fil d'Ariane + actions (maquette). */
export function ProfileEditMediumPageHeader({
  isDirty,
  isSaving,
  saveMessage = null,
  saveMessageIsError = false,
  formId,
}: ProfileEditMediumPageHeaderProps) {
  return (
    <header className="mb-5" data-profile-edit-medium-header="">
      <nav aria-label="Fil d'Ariane" className="mb-3 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/profile/me" className="font-medium transition hover:text-yunicity-primary">
          {PROFILE_EDIT_DESKTOP_BREADCRUMB_PROFILE}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <span className="font-medium text-neutral-800">{PROFILE_EDIT_DESKTOP_BREADCRUMB_EDIT}</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
            {PROFILE_EDIT_PAGE_TITLE}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{PROFILE_EDIT_PAGE_SUBTITLE}</p>
        </div>

        <div className="hidden shrink-0 flex-wrap items-center gap-2 sm:flex">
          <Link
            href="/profile/me"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
          >
            {PROFILE_EDIT_CANCEL}
          </Link>
          <button
            type="submit"
            form={formId}
            disabled={isSaving || !isDirty}
            title={!isDirty && !isSaving ? PROFILE_EDIT_DESKTOP_SAVE_DISABLED_HINT : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {isSaving ? PROFILE_EDIT_SAVING : PROFILE_EDIT_SAVE}
          </button>
        </div>
      </div>

      {saveMessage ? (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
            saveMessageIsError ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"
          }`}
          role="status"
        >
          {saveMessage}
        </p>
      ) : null}
    </header>
  );
}
