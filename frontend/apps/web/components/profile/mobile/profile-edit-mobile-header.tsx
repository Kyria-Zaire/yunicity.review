"use client";

import { PROFILE_MOBILE_BACK, PROFILE_EDIT_PAGE_TITLE } from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/** Header mobile édition profil (MOBILE-PROFILE-01). */
export function ProfileEditMobileHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => router.push("/profile/me")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label={PROFILE_MOBILE_BACK}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-center text-base font-bold text-neutral-900">
          {PROFILE_EDIT_PAGE_TITLE}
        </h1>

        <span className="inline-flex h-10 w-10 shrink-0" aria-hidden />
      </div>
    </header>
  );
}
