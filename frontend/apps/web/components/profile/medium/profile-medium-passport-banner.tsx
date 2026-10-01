"use client";

import type { PassportLevelView } from "@yunicity/utils";
import {
  PROFILE_MEDIUM_PASSPORT_BANNER_CTA,
  PROFILE_MEDIUM_PASSPORT_BANNER_TITLE,
  resolveProfileDesktopPassportSteps,
} from "@yunicity/utils";
import { Globe2 } from "lucide-react";
import Link from "next/link";

type ProfileMediumPassportBannerProps = {
  levelView: PassportLevelView | null;
};

/** Bannière Passport bleue — maquette profil medium. */
export function ProfileMediumPassportBanner({ levelView }: ProfileMediumPassportBannerProps) {
  const steps = resolveProfileDesktopPassportSteps(levelView);
  const segmentCount = 5;

  return (
    <section
      className="overflow-hidden rounded-2xl bg-yunicity-primary p-4 text-white shadow-sm sm:p-5"
      data-profile-medium-passport-banner=""
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="inline-flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-white/20 bg-white/10">
            <Globe2 className="h-6 w-6" aria-hidden />
            <span className="mt-0.5 text-[8px] font-bold tracking-wide">YUNICITY</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/90">{PROFILE_MEDIUM_PASSPORT_BANNER_TITLE}</p>
            <p className="mt-0.5 text-xl font-bold tracking-tight">{steps.levelLabel}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm font-semibold text-white/95">
                {steps.done} / {steps.total}
              </span>
              <div className="flex min-w-0 flex-1 gap-1" aria-hidden>
                {Array.from({ length: segmentCount }, (_, index) => (
                  <span
                    key={index}
                    className={`h-2 min-w-0 flex-1 rounded-full ${
                      index < steps.done ? "bg-white" : "bg-white/25"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Link
          href="/passport"
          className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-yunicity-primary transition hover:bg-white/95 sm:w-auto"
        >
          {PROFILE_MEDIUM_PASSPORT_BANNER_CTA}
        </Link>
      </div>
    </section>
  );
}
