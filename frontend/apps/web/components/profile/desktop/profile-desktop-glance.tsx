"use client";

import type { PassportLevelView } from "@yunicity/utils";
import type { ProfileDesktopGlanceOuting, ProfileDesktopTribeRailItem } from "@yunicity/utils";
import {
  PROFILE_DESKTOP_GLANCE_LEVEL,
  PROFILE_DESKTOP_GLANCE_OUTING,
  PROFILE_DESKTOP_GLANCE_OUTING_CTA,
  PROFILE_DESKTOP_GLANCE_OUTING_EMPTY,
  PROFILE_DESKTOP_GLANCE_OUTING_EXPLORE,
  PROFILE_DESKTOP_GLANCE_PASSPORT,
  PROFILE_DESKTOP_GLANCE_PASSPORT_CTA,
  PROFILE_DESKTOP_GLANCE_STEPS,
  PROFILE_DESKTOP_GLANCE_TRIBE,
  PROFILE_DESKTOP_GLANCE_TRIBE_CTA,
  PROFILE_DESKTOP_GLANCE_TRIBE_EMPTY,
  PROFILE_DESKTOP_GLANCE_TRIBE_EXPLORE,
  resolveProfileDesktopPassportSteps,
} from "@yunicity/utils";
import { ArrowRight, CalendarDays, Stamp, Users } from "lucide-react";
import Link from "next/link";

type ProfileDesktopGlanceProps = {
  levelView: PassportLevelView | null;
  activeTribe: ProfileDesktopTribeRailItem | null;
  nextOuting: ProfileDesktopGlanceOuting | null;
  city: string;
};

/** 3 cartes coup d’œil — à intégrer dans la carte « vie locale ». */
export function ProfileDesktopGlance({
  levelView,
  activeTribe,
  nextOuting,
  city,
}: ProfileDesktopGlanceProps) {
  const steps = resolveProfileDesktopPassportSteps(levelView);

  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3" data-profile-desktop-glance="">
      <article className="rounded-xl border border-neutral-200/80 bg-[#FAFBFC] p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF0FF] text-yunicity-primary">
            <Stamp className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-500">{PROFILE_DESKTOP_GLANCE_PASSPORT}</p>
            <p className="mt-0.5 text-sm font-bold leading-snug text-neutral-900">
              {PROFILE_DESKTOP_GLANCE_LEVEL(steps.levelLabel)}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200/80">
              <div
                className="h-full rounded-full bg-yunicity-primary transition-[width]"
                style={{ width: `${steps.percent}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              {PROFILE_DESKTOP_GLANCE_STEPS(steps.done, steps.total)}
            </p>
            <Link
              href="/passport"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
            >
              {PROFILE_DESKTOP_GLANCE_PASSPORT_CTA}
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>
      </article>

      <article className="rounded-xl border border-neutral-200/80 bg-[#FAFBFC] p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Users className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-500">{PROFILE_DESKTOP_GLANCE_TRIBE}</p>
            {activeTribe ? (
              <>
                <p className="mt-0.5 text-sm font-bold leading-snug text-neutral-900">
                  {activeTribe.name}
                </p>
                <Link
                  href={activeTribe.href}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
                >
                  {PROFILE_DESKTOP_GLANCE_TRIBE_CTA}
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-0.5 text-sm font-medium text-neutral-600">
                  {PROFILE_DESKTOP_GLANCE_TRIBE_EMPTY}
                </p>
                <Link
                  href={`/tribes?city=${encodeURIComponent(city)}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
                >
                  {PROFILE_DESKTOP_GLANCE_TRIBE_EXPLORE}
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </>
            )}
          </div>
        </div>
      </article>

      <article className="rounded-xl border border-neutral-200/80 bg-[#FAFBFC] p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <CalendarDays className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-500">{PROFILE_DESKTOP_GLANCE_OUTING}</p>
            {nextOuting ? (
              <>
                <p className="mt-0.5 text-sm font-bold leading-snug text-neutral-900">
                  {nextOuting.title}
                </p>
                {nextOuting.whenLabel ? (
                  <p className="mt-0.5 text-[11px] text-neutral-500">{nextOuting.whenLabel}</p>
                ) : null}
                <Link
                  href={nextOuting.href}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
                >
                  {PROFILE_DESKTOP_GLANCE_OUTING_CTA}
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-0.5 text-sm font-medium text-neutral-600">
                  {PROFILE_DESKTOP_GLANCE_OUTING_EMPTY}
                </p>
                <Link
                  href="/sortir"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
                >
                  {PROFILE_DESKTOP_GLANCE_OUTING_EXPLORE}
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
