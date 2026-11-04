"use client";

import {
  SETTINGS_MOBILE_HELP,
  SETTINGS_MOBILE_TITLE,
} from "@yunicity/utils";
import { ChevronLeft, CircleHelp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Header hub mobile Paramètres (MOBILE-SETTINGS-02). */
export function SettingsMobileHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="relative flex items-center justify-between gap-2 px-2 py-2.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label="Retour"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <h1 className="pointer-events-none absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate text-base font-bold text-neutral-900">
          {SETTINGS_MOBILE_TITLE}
        </h1>

        <Link
          href="/organizations/request"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
          aria-label={SETTINGS_MOBILE_HELP}
        >
          <CircleHelp className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
