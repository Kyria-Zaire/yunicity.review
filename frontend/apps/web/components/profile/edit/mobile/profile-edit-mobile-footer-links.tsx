"use client";

import {
  PROFILE_EDIT_DESKTOP_COMPLETE_CTA,
  PROFILE_EDIT_DESKTOP_COMPLETE_NEIGHBORHOOD,
  PROFILE_EDIT_DESKTOP_COMPLETE_TITLE,
  PROFILE_EDIT_DESKTOP_HELP_EMAIL_BODY,
  PROFILE_EDIT_DESKTOP_HELP_EMAIL_CTA,
  PROFILE_EDIT_DESKTOP_HELP_EMAIL_TITLE,
} from "@yunicity/utils";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

/** Liens complétion + sécurité sous l'aperçu (maquette mobile). */
export function ProfileEditMobileFooterLinks() {
  return (
    <div className="space-y-3" data-profile-edit-mobile-footer-links="">
      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
              <Home className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-neutral-900">{PROFILE_EDIT_DESKTOP_COMPLETE_TITLE}</h2>
              <p className="mt-0.5 text-xs text-neutral-500">{PROFILE_EDIT_DESKTOP_COMPLETE_NEIGHBORHOOD}</p>
            </div>
          </div>
          <a
            href="#profile-edit-public"
            className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_EDIT_DESKTOP_COMPLETE_CTA}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <Link
          href="/settings#security"
          className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-neutral-50/80"
        >
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-neutral-900">{PROFILE_EDIT_DESKTOP_HELP_EMAIL_TITLE}</h2>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-neutral-500">
              {PROFILE_EDIT_DESKTOP_HELP_EMAIL_BODY}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-yunicity-primary">
            {PROFILE_EDIT_DESKTOP_HELP_EMAIL_CTA}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </Link>
      </section>
    </div>
  );
}
