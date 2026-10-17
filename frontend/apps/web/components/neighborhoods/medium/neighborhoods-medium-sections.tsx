"use client";

import type { NeighborhoodsDesktopActivityItem, NeighborhoodsDesktopRecentItem } from "@yunicity/utils";
import {
  NEIGHBORHOODS_DESKTOP_CONTRIBUTE_CTA,
  NEIGHBORHOODS_DESKTOP_CONTRIBUTE_TITLE,
  NEIGHBORHOODS_DESKTOP_DEFINE_HOOD,
  NEIGHBORHOODS_DESKTOP_NOW_TITLE,
  NEIGHBORHOODS_DESKTOP_RECENT_TITLE,
  NEIGHBORHOODS_DESKTOP_SEE_ALL_ACTIVITIES,
  NEIGHBORHOODS_DESKTOP_SEE_LOCAL_FEED,
  NEIGHBORHOODS_DESKTOP_WHY_INFO,
  NEIGHBORHOODS_MEDIUM_NOW_EMPTY,
  NEIGHBORHOODS_MEDIUM_YOUR_HOOD_EMPTY,
  NEIGHBORHOODS_MEDIUM_YOUR_HOOD_HINT,
  NEIGHBORHOODS_DESKTOP_YOUR_HOOD_TITLE,
} from "@yunicity/utils";
import { CulturalImage } from "@/components/culture/cultural-image";
import { ChevronRight, Home, Lightbulb } from "lucide-react";
import Link from "next/link";

type NeighborhoodsMediumYourHoodProps = {
  className?: string;
};

export function NeighborhoodsMediumYourHood({ className }: NeighborhoodsMediumYourHoodProps) {
  return (
    <section
      className={`rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm ${className ?? ""}`}
      data-neighborhoods-medium-your-hood=""
    >
      <h2 className="text-sm font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_YOUR_HOOD_TITLE}</h2>
      <div className="mt-6 flex flex-col items-center text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
          <Home className="h-7 w-7" aria-hidden />
        </span>
        <p className="mt-3 text-sm font-semibold text-neutral-800">
          {NEIGHBORHOODS_MEDIUM_YOUR_HOOD_EMPTY}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
          {NEIGHBORHOODS_MEDIUM_YOUR_HOOD_HINT}
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
  );
}

type NeighborhoodsMediumNowRailProps = {
  items: NeighborhoodsDesktopActivityItem[];
  city: string;
};

export function NeighborhoodsMediumNowRail({ items, city }: NeighborhoodsMediumNowRailProps) {
  return (
    <section className="space-y-3" data-neighborhoods-medium-now="">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_NOW_TITLE}</h2>
        <Link
          href={`/sortir?city=${encodeURIComponent(city)}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {NEIGHBORHOODS_DESKTOP_SEE_ALL_ACTIVITIES}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
          {NEIGHBORHOODS_MEDIUM_NOW_EMPTY}
        </p>
      ) : (
        <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {items.map((item) => (
            <li key={item.id} className="w-[min(100%,280px)] shrink-0">
              <Link
                href={item.href}
                className="flex h-full gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm transition hover:border-yunicity-primary/30"
              >
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <div className="absolute inset-0">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.title}
                      className="h-full w-full"
                      imageClassName="object-cover"
                      sizes="64px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                </span>
                <span className="min-w-0 self-center">
                  <span className="block text-sm font-semibold text-neutral-900 line-clamp-2">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-neutral-500">{item.subtitle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type NeighborhoodsMediumBottomProps = {
  recentItems: NeighborhoodsDesktopRecentItem[];
  city: string;
};

export function NeighborhoodsMediumBottom({ recentItems, city }: NeighborhoodsMediumBottomProps) {
  return (
    <div
      className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
      data-neighborhoods-medium-bottom=""
    >
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-sm font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_RECENT_TITLE}</h2>
          <Link
            href={`/feed?city=${encodeURIComponent(city)}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {NEIGHBORHOODS_DESKTOP_SEE_LOCAL_FEED}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
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
                <span className="min-w-0 self-center text-sm leading-snug text-neutral-700 line-clamp-2">
                  {item.body}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Lightbulb className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-3 text-sm font-semibold leading-snug text-neutral-900">
          {NEIGHBORHOODS_DESKTOP_CONTRIBUTE_TITLE}
        </p>
        <Link
          href={`/neighborhoods?city=${encodeURIComponent(city)}#contribute`}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-yunicity-primary/35 px-4 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
        >
          {NEIGHBORHOODS_DESKTOP_CONTRIBUTE_CTA}
        </Link>
      </section>
    </div>
  );
}
