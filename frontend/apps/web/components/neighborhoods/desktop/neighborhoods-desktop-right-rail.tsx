"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type {
  NeighborhoodsDesktopActivityItem,
  NeighborhoodsDesktopRecentItem,
} from "@yunicity/utils";
import {
  NEIGHBORHOODS_DESKTOP_CONTRIBUTE_CTA,
  NEIGHBORHOODS_DESKTOP_CONTRIBUTE_TITLE,
  NEIGHBORHOODS_DESKTOP_DEFINE_HOOD,
  NEIGHBORHOODS_DESKTOP_NOW_TITLE,
  NEIGHBORHOODS_DESKTOP_RECENT_TITLE,
  NEIGHBORHOODS_DESKTOP_SEE_ALL_ACTIVITIES,
  NEIGHBORHOODS_DESKTOP_SEE_LOCAL_FEED,
  NEIGHBORHOODS_DESKTOP_WHY_INFO,
  NEIGHBORHOODS_DESKTOP_YOUR_HOOD_BODY,
  NEIGHBORHOODS_DESKTOP_YOUR_HOOD_TITLE,
} from "@yunicity/utils";
import { CalendarDays, ChevronRight, Home, Lightbulb } from "lucide-react";
import Link from "next/link";

type NeighborhoodsDesktopRightRailProps = {
  nowItems: NeighborhoodsDesktopActivityItem[];
  recentItems: NeighborhoodsDesktopRecentItem[];
  city: string;
};

export function NeighborhoodsDesktopRightRail({
  nowItems,
  recentItems,
  city,
}: NeighborhoodsDesktopRightRailProps) {
  return (
    <aside
      className="flex w-full min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:pb-4"
      aria-label="Votre quartier et actualités"
      data-neighborhoods-desktop-right-rail=""
    >
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_YOUR_HOOD_TITLE}</h2>
        <div className="mt-4 flex flex-col items-center text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
            <Home className="h-6 w-6" aria-hidden />
          </span>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {NEIGHBORHOODS_DESKTOP_YOUR_HOOD_BODY}
          </p>
          <Link
            href="/profile/me/edit"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
          >
            {NEIGHBORHOODS_DESKTOP_DEFINE_HOOD}
          </Link>
          <Link
            href="/settings"
            className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {NEIGHBORHOODS_DESKTOP_WHY_INFO}
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_NOW_TITLE}</h2>
        <ul className="mt-3 space-y-3">
          {nowItems.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="flex gap-3 rounded-xl transition hover:bg-neutral-50">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  <div className="absolute inset-0">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.title}
                      className="h-full w-full"
                      imageClassName="object-cover"
                      sizes="48px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900 line-clamp-2">
                    {item.title}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    <span className="truncate">{item.subtitle}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={`/sortir?city=${encodeURIComponent(city)}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {NEIGHBORHOODS_DESKTOP_SEE_ALL_ACTIVITIES}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_RECENT_TITLE}</h2>
        <ul className="mt-3 space-y-3">
          {recentItems.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="flex gap-3 rounded-xl transition hover:bg-neutral-50">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  <div className="absolute inset-0">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.body}
                      className="h-full w-full"
                      imageClassName="object-cover"
                      sizes="48px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                </span>
                <span className="min-w-0 text-sm leading-relaxed text-neutral-700 line-clamp-3">
                  {item.body}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/feed"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {NEIGHBORHOODS_DESKTOP_SEE_LOCAL_FEED}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Lightbulb className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">
              {NEIGHBORHOODS_DESKTOP_CONTRIBUTE_TITLE}
            </p>
            <Link
              href="/organizations/request"
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-yunicity-primary/35 px-3.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
            >
              {NEIGHBORHOODS_DESKTOP_CONTRIBUTE_CTA}
            </Link>
          </div>
        </div>
      </section>
    </aside>
  );
}
