"use client";

import type { PassportOverviewPassportResponse, PassportSummaryResponse } from "@yunicity/types";
import {
  formatPassportStatusLabel,
  formatPassportTierHumanSubtitle,
  formatPassportTierLabel,
  getPassportHeroContextMessage,
} from "@yunicity/utils";
import { Shield } from "lucide-react";

type PassportHeroProps = {
  summary: PassportSummaryResponse;
  passport: PassportOverviewPassportResponse;
};

export function PassportHero({ summary, passport }: PassportHeroProps) {
  const tierLabel = formatPassportTierLabel(summary.passport_tier);
  const tierSubtitle = formatPassportTierHumanSubtitle(summary.passport_tier);
  const statusLabel = formatPassportStatusLabel(passport.status);
  const isActive = passport.status === "active";
  const contextMessage = getPassportHeroContextMessage({
    passportStatus: passport.status,
    passportTier: summary.passport_tier,
    earnedBadges: summary.earned_badges,
  });

  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-200/90 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white shadow-lg">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-yunicity-primary/20 blur-3xl"
        aria-hidden
      />
      <div className="relative p-6 sm:p-8">
        <div className="flex items-center gap-2 text-[#C7D2FE]">
          <Shield className="h-5 w-5" aria-hidden />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Identité locale</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Mon Passport Yunicity</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-200">{contextMessage}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            <span className="block">{tierLabel}</span>
            {tierSubtitle ? (
              <span className="mt-0.5 block text-[11px] font-normal text-neutral-300">{tierSubtitle}</span>
            ) : null}
          </span>
          <span
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              isActive ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"
            }`}
          >
            Passport {statusLabel}
          </span>
        </div>
      </div>
    </section>
  );
}
