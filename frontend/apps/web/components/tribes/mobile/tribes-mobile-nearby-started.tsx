"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesDesktopNearbyRow } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_GET_STARTED_GUIDE,
  TRIBES_DESKTOP_GET_STARTED_TITLE,
  TRIBES_DESKTOP_NEARBY_TITLE,
  TRIBES_MEDIUM_GET_STARTED_PRIVACY,
  TRIBES_MEDIUM_GET_STARTED_REPORT,
  TRIBES_MEDIUM_GET_STARTED_RULES,
  TRIBES_MEDIUM_NEARBY_EDIT,
  TRIBES_MOBILE_NEARBY_SUBTITLE,
} from "@yunicity/utils";
import { AlertCircle, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

type TribesMobileNearbyStartedProps = {
  city: string;
  neighborhoodLabel: string;
  nearbyRows: TribesDesktopNearbyRow[];
};

export function TribesMobileNearbyStarted({
  city,
  neighborhoodLabel,
  nearbyRows,
}: TribesMobileNearbyStartedProps) {
  const getStartedItems = [
    TRIBES_MEDIUM_GET_STARTED_RULES,
    TRIBES_MEDIUM_GET_STARTED_PRIVACY,
    TRIBES_MEDIUM_GET_STARTED_REPORT,
  ];

  return (
    <div className="space-y-4" data-tribes-mobile-nearby-started="">
      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm" aria-labelledby="tribes-mobile-nearby-title">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 id="tribes-mobile-nearby-title" className="text-sm font-bold text-neutral-900">
            {TRIBES_DESKTOP_NEARBY_TITLE}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            {TRIBES_MOBILE_NEARBY_SUBTITLE(neighborhoodLabel)}
          </p>
        </div>

        {nearbyRows.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {nearbyRows.slice(0, 2).map((row) => (
              <li key={row.id}>
                <Link href={row.href} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                    <CulturalImage
                      src={row.imageUrl}
                      alt=""
                      placeName={row.name}
                      className="absolute inset-0 size-full"
                      sizes="36px"
                      showFallbackCaption={false}
                      dimOverlay={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{row.name}</p>
                    <p className="truncate text-xs text-neutral-500">{row.metaLine}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-neutral-500">Aucune suggestion locale pour le moment.</p>
        )}

        <div className="border-t border-neutral-100 p-3">
          <Link
            href={`/profile?city=${encodeURIComponent(city)}`}
            className="text-sm font-semibold text-yunicity-primary"
          >
            {TRIBES_MEDIUM_NEARBY_EDIT}
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm" aria-labelledby="tribes-mobile-get-started-title">
        <div className="flex items-start gap-2 border-b border-neutral-100 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-yunicity-primary" aria-hidden />
          <h2 id="tribes-mobile-get-started-title" className="text-sm font-bold text-neutral-900">
            {TRIBES_DESKTOP_GET_STARTED_TITLE}
          </h2>
        </div>
        <ul className="space-y-2 p-4">
          {getStartedItems.map((label, index) => (
            <li key={label} className="flex items-center gap-2 text-sm text-neutral-700">
              {index === 2 ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              )}
              {label}
            </li>
          ))}
        </ul>
        <div className="border-t border-neutral-100 p-3">
          <Link
            href="/help/tribes"
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary"
          >
            {TRIBES_DESKTOP_GET_STARTED_GUIDE}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
