"use client";

import type { PassportLevelView } from "@yunicity/utils";
import {
  PROFILE_MOBILE_LEVEL_BODY,
  PROFILE_MOBILE_LEVEL_CTA,
  resolveProfileMobileLevelXpLabel,
} from "@yunicity/utils";
import { Sparkles } from "lucide-react";
import Link from "next/link";

type ProfileMobileLevelBannerProps = {
  levelView: PassportLevelView;
};

/** Bannière progression Passport mobile (MOBILE-PROFILE-01). */
export function ProfileMobileLevelBanner({ levelView }: ProfileMobileLevelBannerProps) {
  const nextThreshold = levelView.nextLevel?.threshold ?? null;
  const xpLabel = resolveProfileMobileLevelXpLabel(levelView.points, nextThreshold);

  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] p-4 text-white shadow-md">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/20">
          <Sparkles className="h-5 w-5 text-amber-200" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{levelView.level.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/85">{PROFILE_MOBILE_LEVEL_BODY}</p>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[11px] font-medium text-white/80">{xpLabel}</p>
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300 transition-all"
                  style={{ width: `${levelView.progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={levelView.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>

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
