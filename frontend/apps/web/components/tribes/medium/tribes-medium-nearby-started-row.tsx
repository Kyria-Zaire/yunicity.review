"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesDesktopNearbyRow } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_GET_STARTED_GUIDE,
  TRIBES_DESKTOP_GET_STARTED_TITLE,
  TRIBES_DESKTOP_NEARBY_SUBTITLE,
  TRIBES_DESKTOP_NEARBY_TITLE,
  TRIBES_MEDIUM_GET_STARTED_PRIVACY,
  TRIBES_MEDIUM_GET_STARTED_REPORT,
  TRIBES_MEDIUM_GET_STARTED_RULES,
  TRIBES_MEDIUM_NEARBY_EDIT,
} from "@yunicity/utils";
import { AlertCircle, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

type TribesMediumNearbyStartedRowProps = {
  city: string;
  neighborhoodLabel: string;
  nearbyRows: TribesDesktopNearbyRow[];
};

export function TribesMediumNearbyStartedRow({
  city,
  neighborhoodLabel,
  nearbyRows,
}: TribesMediumNearbyStartedRowProps) {
  const getStartedItems = [
    TRIBES_MEDIUM_GET_STARTED_RULES,
    TRIBES_MEDIUM_GET_STARTED_PRIVACY,
    TRIBES_MEDIUM_GET_STARTED_REPORT,
  ];

  return (
    <div className="tribes-medium-nearby-row grid gap-4 sm:grid-cols-2" data-tribes-medium-nearby-row="">
      <section className="feed-desktop-surface overflow-hidden" aria-labelledby="tribes-medium-nearby-title">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 id="tribes-medium-nearby-title" className="text-sm font-bold text-neutral-900">
            {TRIBES_DESKTOP_NEARBY_TITLE}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            {TRIBES_DESKTOP_NEARBY_SUBTITLE(neighborhoodLabel)}
          </p>
        </div>

        {nearbyRows.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {nearbyRows.slice(0, 2).map((row) => (
              <li key={row.id}>
                <Link href={row.href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-50">
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
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {TRIBES_MEDIUM_NEARBY_EDIT}
          </Link>
        </div>
      </section>

      <section className="feed-desktop-surface overflow-hidden" aria-labelledby="tribes-medium-get-started-title">
        <div className="flex items-start gap-2 border-b border-neutral-100 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-yunicity-primary" aria-hidden />
          <h2 id="tribes-medium-get-started-title" className="text-sm font-bold text-neutral-900">
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
        <div className="border-t border-neutral-100 p-3 text-right">
          <Link
            href="/help/tribes"
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {TRIBES_DESKTOP_GET_STARTED_GUIDE}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
