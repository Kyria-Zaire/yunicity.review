"use client";

import type { PassportDerivedBadge } from "@yunicity/utils";
import {
  PASSPORT_BADGES_EMPTY,
  PASSPORT_BADGES_TITLE,
  PASSPORT_BADGES_VIEW_ALL,
  formatPassportDate,
} from "@yunicity/utils";
import Link from "next/link";

type PassportRecentBadgesProps = {
  badges: PassportDerivedBadge[];
};

export function PassportRecentBadges({ badges }: PassportRecentBadgesProps) {
  const earned = badges.filter((badge) => badge.earned);
  const preview = earned.length > 0 ? earned : badges;

  return (
    <section id="passport-badges" className="scroll-mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-bold text-neutral-900">{PASSPORT_BADGES_TITLE}</h2>
        <Link
          href="#passport-badges"
          className="text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {PASSPORT_BADGES_VIEW_ALL}
        </Link>
      </div>

      {earned.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
          {PASSPORT_BADGES_EMPTY}
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {preview.slice(0, 5).map((badge) => (
            <li
              key={badge.id}
              className={`rounded-2xl border p-4 shadow-sm ${
                badge.earned
                  ? "border-neutral-200/90 bg-white"
                  : "border-neutral-200/60 bg-neutral-50 opacity-70"
              }`}
            >
              <p className="text-sm font-semibold text-neutral-900">{badge.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{badge.description}</p>
              {badge.earned && badge.earnedAt ? (
                <p className="mt-2 text-[10px] text-neutral-500">
                  Obtenu · {formatPassportDate(badge.earnedAt)}
                </p>
              ) : badge.earned ? (
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Obtenu
                </p>
              ) : (
                <p className="mt-2 text-[10px] text-neutral-400">En cours</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
