"use client";

import type { PassportLevelView } from "@yunicity/utils";
import {
  PROFILE_MOBILE_LEVEL_BODY,
  PROFILE_MOBILE_LEVEL_CTA,
} from "@yunicity/utils";
import { Sparkles } from "lucide-react";
import Link from "next/link";

type ProfileMobileLevelBannerProps = {
  levelView: PassportLevelView;
};

/** Bannière progression Passport mobile (MOBILE-PROFILE-01). */
export function ProfileMobileLevelBanner({ levelView }: ProfileMobileLevelBannerProps) {
  // PASSPORT-LEVEL-SCALE-01 : le tier Passport, ni XP ni barre (D1, D4).

  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] p-4 text-white shadow-md">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/20">
          <Sparkles className="h-5 w-5 text-amber-200" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{levelView.currentLabel}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/85">{PROFILE_MOBILE_LEVEL_BODY}</p>

          <div className="mt-3 flex justify-end">
            <Link
              href="/passport"
              className="shrink-0 rounded-full border border-white/40 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10"
            >
              {PROFILE_MOBILE_LEVEL_CTA}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
