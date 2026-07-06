"use client";

import { SETTINGS_MOBILE_BACK } from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";

type SettingsMobileSectionHeaderProps = {
  title: string;
  onBack: () => void;
};

/** Header détail section mobile (MOBILE-SETTINGS-01). */
export function SettingsMobileSectionHeader({ title, onBack }: SettingsMobileSectionHeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label={SETTINGS_MOBILE_BACK}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-base font-bold text-neutral-900">{title}</h1>

        <span className="inline-flex h-10 w-10 shrink-0" aria-hidden />
      </div>
    </header>
  );
}
