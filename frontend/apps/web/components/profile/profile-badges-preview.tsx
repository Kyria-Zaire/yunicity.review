"use client";

import type { PassportDerivedBadge } from "@yunicity/utils";
import {
  PROFILE_PORTAL_BADGES_PREVIEW_CTA,
  PROFILE_PORTAL_BADGES_PREVIEW_EMPTY,
  PROFILE_PORTAL_BADGES_PREVIEW_TITLE,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const BADGE_TONE: Record<string, string> = {
  curious_explorer: "border-orange-300 bg-orange-50 text-orange-700",
  engaged_sharer: "border-sky-300 bg-sky-50 text-sky-700",
  connector: "border-violet-300 bg-violet-50 text-violet-700",
  local_supporter: "border-rose-300 bg-rose-50 text-rose-700",
  ambiance_maker: "border-pink-300 bg-pink-50 text-pink-700",
};

type ProfileBadgesPreviewProps = {
  badges: PassportDerivedBadge[];
  emptyCopy: string;
};

export function ProfileBadgesPreview({ badges, emptyCopy }: ProfileBadgesPreviewProps) {
  const earned = badges.filter((badge) => badge.earned);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-neutral-900">{PROFILE_PORTAL_BADGES_PREVIEW_TITLE}</h2>
        <Link
          href="/passport"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {PROFILE_PORTAL_BADGES_PREVIEW_CTA}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {earned.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">{emptyCopy || PROFILE_PORTAL_BADGES_PREVIEW_EMPTY}</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-4">
          {earned.slice(0, 4).map((badge) => (
            <li key={badge.id} className="flex w-[5rem] flex-col items-center gap-1.5 text-center">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-[10px] font-bold uppercase leading-tight ${
                  BADGE_TONE[badge.id] ?? "border-neutral-300 bg-neutral-50 text-neutral-700"
                }`}
                style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
              >
                <span className="px-1">✓</span>
              </span>
              <span className="line-clamp-2 text-[10px] font-medium leading-snug text-neutral-700">
                {badge.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
