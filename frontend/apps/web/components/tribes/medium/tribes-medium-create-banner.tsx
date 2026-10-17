"use client";

import {
  TRIBES_DESKTOP_CREATE_BANNER_RULES,
  TRIBES_DESKTOP_CREATE_CTA,
  TRIBES_MEDIUM_CREATE_BANNER_BODY,
  TRIBES_MEDIUM_CREATE_BANNER_TITLE,
  TRIBES_PORTAL_CREATE_HREF,
} from "@yunicity/utils";
import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";

type TribesMediumCreateBannerProps = {
  city: string;
};

export function TribesMediumCreateBanner({ city }: TribesMediumCreateBannerProps) {
  return (
    <section
      className="rounded-2xl border border-violet-100 bg-violet-50/80 px-5 py-6 sm:px-6"
      aria-label="Créer une tribu"
      data-tribes-medium-create-banner=""
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-yunicity-primary shadow-sm">
            <Users className="h-7 w-7" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-neutral-900">{TRIBES_MEDIUM_CREATE_BANNER_TITLE}</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">{TRIBES_MEDIUM_CREATE_BANNER_BODY}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            href={`${TRIBES_PORTAL_CREATE_HREF}?city=${encodeURIComponent(city)}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
          >
            + {TRIBES_DESKTOP_CREATE_CTA}
          </Link>
          <Link
            href="/help/tribes"
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {TRIBES_DESKTOP_CREATE_BANNER_RULES}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
