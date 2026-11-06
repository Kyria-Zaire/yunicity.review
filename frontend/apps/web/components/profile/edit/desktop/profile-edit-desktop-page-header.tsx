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

type ProfileEditDesktopPageHeaderProps = {
  isDirty: boolean;
  isSaving: boolean;
  saveMessage?: string | null;
  saveMessageIsError?: boolean;
};

/** En-tête page édition desktop — fil d'Ariane + actions. */
export function ProfileEditDesktopPageHeader({
  isDirty,
  isSaving,
  saveMessage = null,
  saveMessageIsError = false,
}: ProfileEditDesktopPageHeaderProps) {
  return (
    <header className="mb-6" data-profile-edit-desktop-header="">
      <nav aria-label="Fil d'Ariane" className="mb-3 flex items-center gap-1.5 text-sm text-neutral-500">
        <Link href="/profile/me" className="font-medium transition hover:text-yunicity-primary">
          {PROFILE_EDIT_DESKTOP_BREADCRUMB_PROFILE}
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        <span className="font-medium text-neutral-800">{PROFILE_EDIT_DESKTOP_BREADCRUMB_EDIT}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {PROFILE_EDIT_PAGE_TITLE}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
            {PROFILE_EDIT_PAGE_SUBTITLE}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/profile/me"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
          >
            {PROFILE_EDIT_CANCEL}
          </Link>
          <button
            type="submit"
            form="profile-edit-desktop-form"
            disabled={isSaving || !isDirty}
            title={!isDirty && !isSaving ? PROFILE_EDIT_DESKTOP_SAVE_DISABLED_HINT : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
