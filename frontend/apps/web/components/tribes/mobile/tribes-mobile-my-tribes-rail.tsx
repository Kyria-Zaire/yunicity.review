"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesDesktopMyTribeRow } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_YOUR_TRIBES_CTA,
  TRIBES_DESKTOP_YOUR_TRIBES_EMPTY,
  TRIBES_DESKTOP_YOUR_TRIBES_TITLE,
  TRIBES_MOBILE_MY_TRIBES_NEW,
  TRIBES_MOBILE_MY_TRIBES_NEW_FEM,
} from "@yunicity/utils";
import Link from "next/link";

type TribesMobileMyTribesRailProps = {
  city: string;
  myTribes: TribesDesktopMyTribeRow[];
};

function badgeForStatus(statusLine: string): string | null {
  const lower = statusLine.toLowerCase();
  if (lower.includes("nouvelle")) return TRIBES_MOBILE_MY_TRIBES_NEW_FEM;
  if (lower.includes("nouveau")) return TRIBES_MOBILE_MY_TRIBES_NEW;
  return null;
}

export function TribesMobileMyTribesRail({ city, myTribes }: TribesMobileMyTribesRailProps) {
  return (
    <section className="space-y-3" aria-labelledby="tribes-mobile-your-tribes-title" data-tribes-mobile-my-rail="">
      <div className="flex items-center justify-between gap-3">
        <h2 id="tribes-mobile-your-tribes-title" className="text-base font-bold text-neutral-900">
          {TRIBES_DESKTOP_YOUR_TRIBES_TITLE}
        </h2>
        <Link
          href={`/tribes?city=${encodeURIComponent(city)}&view=mine`}
          className="text-sm font-semibold text-yunicity-primary"
        >
          {TRIBES_DESKTOP_YOUR_TRIBES_CTA}
        </Link>
      </div>

      {myTribes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
          {TRIBES_DESKTOP_YOUR_TRIBES_EMPTY}
        </p>
      ) : (
        <ul className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {myTribes.map((row) => {
            const badge = badgeForStatus(row.statusLine);
            return (
              <li key={row.id} className="w-[88px] shrink-0">
                <Link href={row.href} className="flex flex-col items-center gap-2 text-center">
                  <div className="relative">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full bg-neutral-200 ring-2 ring-white shadow-sm">
                      <CulturalImage
                        src={row.imageUrl}
                        alt=""
                        placeName={row.name}
                        className="absolute inset-0 size-full"
                        sizes="64px"
                        showFallbackCaption={false}
                        dimOverlay={false}
                      />
                    </div>
                    {badge ? (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-yunicity-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-neutral-900">{row.name}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
