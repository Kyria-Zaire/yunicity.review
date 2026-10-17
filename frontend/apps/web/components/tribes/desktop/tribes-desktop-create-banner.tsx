"use client";

import {
  TRIBES_DESKTOP_CREATE_BANNER_BODY,
  TRIBES_DESKTOP_CREATE_BANNER_RULES,
  TRIBES_DESKTOP_CREATE_CTA,
  TRIBES_PORTAL_CREATE_HREF,
} from "@yunicity/utils";
import Link from "next/link";

type TribesDesktopCreateBannerProps = {
  city: string;
};

export function TribesDesktopCreateBanner({ city }: TribesDesktopCreateBannerProps) {
  return (
    <section
      className="rounded-2xl border border-violet-100 bg-violet-50/80 px-5 py-6 sm:px-6"
      aria-label="Créer une tribu"
      data-tribes-desktop-create-banner=""
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-700">{TRIBES_DESKTOP_CREATE_BANNER_BODY}</p>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            href={`${TRIBES_PORTAL_CREATE_HREF}?city=${encodeURIComponent(city)}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
          >
            + {TRIBES_DESKTOP_CREATE_CTA}
          </Link>
          <Link href="/help/tribes" className="text-sm font-semibold text-yunicity-primary hover:underline">
            {TRIBES_DESKTOP_CREATE_BANNER_RULES}
          </Link>
        </div>
      </div>
    </section>
  );
}
