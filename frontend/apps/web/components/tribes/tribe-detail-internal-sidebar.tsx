"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribeDetailSidebarTribe } from "@yunicity/utils";
import {
  TRIBES_PORTAL_CREATE_CTA,
  TRIBES_PORTAL_CREATE_HREF,
  TRIBES_PORTAL_PAGE_TITLE,
  TRIBES_PORTAL_SIDEBAR_CTA_BODY,
  TRIBES_PORTAL_SIDEBAR_CTA_BUTTON,
  TRIBES_PORTAL_SIDEBAR_CTA_TITLE,
  TRIBES_PORTAL_SUBTITLE,
  TRIBE_DETAIL_PORTAL_SIDEBAR_TRIBES,
  TRIBE_DETAIL_PORTAL_SIDEBAR_TRIBES_CTA,
} from "@yunicity/utils";
import { Plus, Users } from "lucide-react";
import Link from "next/link";

type TribeDetailInternalSidebarProps = {
  memberTribes: TribeDetailSidebarTribe[];
  city: string;
};

export function TribeDetailInternalSidebar({ memberTribes, city }: TribeDetailInternalSidebarProps) {
  const cityHref = `/tribes?city=${encodeURIComponent(city)}&view=mine`;

  return (
    <aside className="hidden w-56 shrink-0 self-start xl:block xl:w-60">
      <div className="sticky top-24 pb-6 pr-2">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{TRIBES_PORTAL_PAGE_TITLE}</h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{TRIBES_PORTAL_SUBTITLE}</p>
        </div>

        <Link
          href={TRIBES_PORTAL_CREATE_HREF}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary-hover"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {TRIBES_PORTAL_CREATE_CTA}
        </Link>

        {memberTribes.length > 0 ? (
          <div className="mt-8 rounded-2xl bg-yunicity-primary-soft/60 p-4 ring-1 ring-yunicity-primary/10">
            <p className="text-sm font-bold text-neutral-900">{TRIBE_DETAIL_PORTAL_SIDEBAR_TRIBES}</p>
            <ul className="mt-3 space-y-2">
              {memberTribes.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-xl px-2 py-2 transition ${
                      item.isActive
                        ? "bg-white shadow-sm ring-1 ring-yunicity-primary/25"
                        : "hover:bg-white/80"
                    }`}
                  >
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                      <CulturalImage
                        src={item.imageUrl}
                        alt={item.name}
                        placeName={item.name}
                        className="size-full"
                        sizes="36px"
                        showFallbackCaption={false}
                        overlay={false}
                      />
                    </div>
                    <span className="line-clamp-2 text-sm font-medium text-neutral-800">{item.name}</span>
                    {item.isActive ? (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-yunicity-primary" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={cityHref}
              className="mt-3 inline-flex text-xs font-semibold text-yunicity-primary hover:underline"
            >
              {TRIBE_DETAIL_PORTAL_SIDEBAR_TRIBES_CTA} →
            </Link>
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] p-5 text-white shadow-md">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-semibold">{TRIBES_PORTAL_SIDEBAR_CTA_TITLE}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/80">{TRIBES_PORTAL_SIDEBAR_CTA_BODY}</p>
          <Link
            href={TRIBES_PORTAL_CREATE_HREF}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-white/90"
          >
            {TRIBES_PORTAL_SIDEBAR_CTA_BUTTON}
          </Link>
        </div>
      </div>
    </aside>
  );
}
