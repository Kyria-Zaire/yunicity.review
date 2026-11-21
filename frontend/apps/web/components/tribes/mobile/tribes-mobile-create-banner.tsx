"use client";

import {
  TRIBES_DESKTOP_CREATE_CTA,
  TRIBES_MEDIUM_CREATE_BANNER_BODY,
  TRIBES_MEDIUM_CREATE_BANNER_TITLE,
  TRIBES_PORTAL_CREATE_HREF,
} from "@yunicity/utils";
import { Users } from "lucide-react";
import Link from "next/link";

type TribesMobileCreateBannerProps = {
  city: string;
};

export function TribesMobileCreateBanner({ city }: TribesMobileCreateBannerProps) {
  return (
    <section
      className="rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-5"
      aria-label="Créer une tribu"
      data-tribes-mobile-create-banner=""
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-yunicity-primary shadow-sm">
          <Users className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-neutral-900">{TRIBES_MEDIUM_CREATE_BANNER_TITLE}</h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">{TRIBES_MEDIUM_CREATE_BANNER_BODY}</p>
          <Link
            href={`${TRIBES_PORTAL_CREATE_HREF}?city=${encodeURIComponent(city)}`}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-yunicity-primary/40 bg-white px-4 text-sm font-semibold text-yunicity-primary"
          >
            + {TRIBES_DESKTOP_CREATE_CTA}
          </Link>
        </div>
      </div>
    </section>
  );
}
