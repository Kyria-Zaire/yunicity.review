"use client";

import type { ProfileImpactLabel } from "@yunicity/utils";
import {
  PROFILE_PORTAL_IMPACT_BODY,
  PROFILE_PORTAL_IMPACT_CTA,
  PROFILE_PORTAL_IMPACT_LABEL,
  PROFILE_PORTAL_IMPACT_TITLE,
} from "@yunicity/utils";
import Link from "next/link";

type ProfileMobileImpactCardProps = {
  impact: ProfileImpactLabel;
};

/** Carte impact local mobile (MOBILE-PROFILE-01). */
export function ProfileMobileImpactCard({ impact }: ProfileMobileImpactCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] p-4 text-white shadow-md">
      <p className="text-sm font-semibold">{PROFILE_PORTAL_IMPACT_TITLE}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/80">{PROFILE_PORTAL_IMPACT_BODY}</p>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(147,197,253,0.95)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(impact.percent / 100) * 327} 327`}
            />
          </svg>
          <div className="px-1 text-center">
            <p className={`font-bold leading-tight text-white ${impact.showPercent ? "text-lg" : "text-xs"}`}>
              {impact.primary}
            </p>
            {impact.showPercent ? (
              <p className="mt-0.5 text-[10px] text-white/75">{impact.secondary}</p>
            ) : (
              <p className="mt-0.5 text-[10px] text-white/60">{PROFILE_PORTAL_IMPACT_LABEL}</p>
            )}
          </div>
        </div>

        <Link
          href="/passport"
          className="inline-flex flex-1 items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
        >
          {PROFILE_PORTAL_IMPACT_CTA}
        </Link>
      </div>
    </section>
  );
}
