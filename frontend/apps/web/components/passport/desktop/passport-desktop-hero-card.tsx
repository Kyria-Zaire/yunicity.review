"use client";

import type { PassportDesktopSegmentProgress, PassportLevelView } from "@yunicity/utils";
import {
  PASSPORT_DESKTOP_HERO_HISTORY_CTA,
  PASSPORT_DESKTOP_HERO_KICKER,
  PASSPORT_DESKTOP_HERO_LEVEL_PREFIX,
  PASSPORT_DESKTOP_HERO_NEXT_LEVEL,
  PASSPORT_DESKTOP_HERO_PROGRESS_HINT,
  PASSPORT_DESKTOP_HERO_SCAN_CTA,
  PASSPORT_DESKTOP_HERO_SEGMENT_LABEL,
  formatPassportDesktopLevelName,
} from "@yunicity/utils";
import { PassportBookletMark } from "@/components/passport/passport-booklet-icon";
import { History, QrCode, UserRound } from "lucide-react";
import Link from "next/link";

const HERO_IMAGE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Reims_Cathedral_-_west_facade_%28by_Pudelek%29.jpg/1280px-Reims_Cathedral_-_west_facade_%28by_Pudelek%29.jpg";

type PassportDesktopHeroCardProps = {
  city: string;
  displayName: string;
  levelView: PassportLevelView;
  segmentProgress: PassportDesktopSegmentProgress;
  onOpenHistory: () => void;
};

export function PassportDesktopHeroCard({
  city,
  displayName,
  levelView,
  segmentProgress,
  onOpenHistory,
}: PassportDesktopHeroCardProps) {
  const nextLabel = formatPassportDesktopLevelName(
    levelView.nextLevelLabel ?? levelView.nextLevel?.label ?? "",
  );
  const currentLabel = formatPassportDesktopLevelName(levelView.level.label);

  return (
    <section
      id="passport-desktop-overview"
      className="relative scroll-mt-28 overflow-hidden rounded-[1.35rem] bg-yunicity-primary text-white shadow-[0_18px_40px_rgba(37,99,235,0.22)]"
      data-passport-desktop-hero=""
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[46%] bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-yunicity-primary via-yunicity-primary/92 to-yunicity-primary/70"
        aria-hidden
      />

      <div className="relative grid grid-cols-[5.25rem_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6 sm:p-6 md:grid-cols-[9.75rem_minmax(0,1fr)_minmax(12.5rem,15.5rem)] md:items-stretch">
        <div>
          <div className="md:hidden">
            <PassportBookletMark compact />
          </div>
          <div className="hidden md:block">
            <PassportBookletMark />
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
            {PASSPORT_DESKTOP_HERO_KICKER(city)}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h2>
          <p className="mt-1 text-sm text-white/85">
            {PASSPORT_DESKTOP_HERO_LEVEL_PREFIX} · {currentLabel}
          </p>

          <div className="mt-5 max-w-md">
            <div className="flex gap-1.5" aria-hidden>
              {Array.from({ length: segmentProgress.total }).map((_, index) => (
                <span
                  key={index}
                  className={`h-2.5 flex-1 rounded-full ${index < segmentProgress.completed ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs font-medium text-white/90">
              {PASSPORT_DESKTOP_HERO_SEGMENT_LABEL(segmentProgress.completed, segmentProgress.total)}
            </p>
            <p className="mt-1 text-[11px] text-white/70">{PASSPORT_DESKTOP_HERO_PROGRESS_HINT}</p>
          </div>
        </div>

        <div className="col-span-2 flex flex-col justify-end gap-4 md:col-span-1">
          {nextLabel ? (
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <UserRound className="h-4 w-4 shrink-0 text-white/85" aria-hidden />
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-wide text-white/70">
                  {PASSPORT_DESKTOP_HERO_NEXT_LEVEL}
                </span>
                {nextLabel}
              </span>
            </p>
          ) : null}

          <div className="flex flex-row gap-2.5">
            <Link
              href="#passport-desktop-qr"
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-center text-sm font-semibold text-yunicity-primary transition hover:bg-white/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <QrCode className="h-4 w-4 shrink-0" aria-hidden />
              {PASSPORT_DESKTOP_HERO_SCAN_CTA}
            </Link>
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-white/80 bg-transparent px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <History className="h-4 w-4 shrink-0" aria-hidden />
              {PASSPORT_DESKTOP_HERO_HISTORY_CTA}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
