"use client";

import {
  NOTIFICATIONS_PAGE_LEDE,
  NOTIFICATIONS_PAGE_SUBTITLE,
  NOTIFICATIONS_PAGE_TITLE,
} from "@yunicity/utils";
import { BellRing } from "lucide-react";

type NotificationsHeroProps = {
  activeHeading?: string;
};

export function NotificationsHero({ activeHeading }: NotificationsHeroProps) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-yunicity-primary/10 shadow-sm"
      style={{
        background:
          "linear-gradient(128deg, rgba(238,240,255,0.95) 0%, rgba(255,255,255,0.98) 48%, rgba(245,243,255,0.92) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-yunicity-primary/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-start gap-4 p-5 sm:p-6">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-yunicity-primary shadow-sm ring-1 ring-yunicity-primary/15">
          <BellRing className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yunicity-primary/80">
            Fil local
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.65rem]">
            {NOTIFICATIONS_PAGE_TITLE}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-700 sm:text-base">
            {NOTIFICATIONS_PAGE_SUBTITLE}
          </p>
          <p className="mt-1 hidden text-xs leading-relaxed text-neutral-500 sm:block">
            {NOTIFICATIONS_PAGE_LEDE}
          </p>
          {activeHeading ? (
            <p className="mt-3 text-xs font-semibold text-yunicity-primary lg:hidden">
              {activeHeading}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
