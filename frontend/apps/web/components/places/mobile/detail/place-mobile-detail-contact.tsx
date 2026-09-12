"use client";

import type { CulturalPlaceDetail } from "@yunicity/types";
import {
  PLACE_DETAIL_MOBILE_ACCESSIBLE,
  PLACE_DETAIL_MOBILE_CONTACT_CALL,
  PLACE_DETAIL_MOBILE_CONTACT_OFFICIAL,
  PLACE_DETAIL_MOBILE_CONTACT_TITLE,
  buildPlaceMobileDetailQuickInfo,
} from "@yunicity/utils";
import { Accessibility, ChevronRight, Globe, Phone } from "lucide-react";
import Link from "next/link";

type PlaceMobileDetailContactProps = {
  place: CulturalPlaceDetail;
};

export function PlaceMobileDetailContact({ place }: PlaceMobileDetailContactProps) {
  const website = buildPlaceMobileDetailQuickInfo(place).find((item) => item.key === "website");

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-place-mobile-detail-contact=""
    >
      <h2 className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
        {PLACE_DETAIL_MOBILE_CONTACT_TITLE}
      </h2>
      <ul className="divide-y divide-neutral-100">
        {website?.href ? (
          <li>
            <a
              href={website.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-800"
            >
              <Globe className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              <span className="flex-1">{PLACE_DETAIL_MOBILE_CONTACT_OFFICIAL}</span>
              <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
            </a>
          </li>
        ) : null}
        <li>
          <span className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-800">
            <Phone className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
            <span className="flex-1">{PLACE_DETAIL_MOBILE_CONTACT_CALL}</span>
            <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
          </span>
        </li>
        <li>
          <span className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-800">
            <Accessibility className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <span className="flex-1">{PLACE_DETAIL_MOBILE_ACCESSIBLE}</span>
            <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
          </span>
        </li>
      </ul>
    </section>
  );
}
