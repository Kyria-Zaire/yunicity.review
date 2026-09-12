"use client";

import { EventDesktopHero } from "@/components/events/desktop/event-desktop-hero";
import { EVENT_DETAIL_BACK_SORTIR, EVENT_DETAIL_MOBILE_GALLERY } from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type EventMobileDetailHeroProps = {
  title: string;
  imageUrls: string[];
  categoryLabel: string;
};

export function EventMobileDetailHero({
  title,
  imageUrls,
  categoryLabel,
}: EventMobileDetailHeroProps) {
  return (
    <div data-event-mobile-hero="">
      <header
        className="mb-2.5 flex items-center gap-x-3"
        data-event-mobile-hero-header=""
      >
        <Link
          href="/sortir"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 text-sm font-semibold text-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {EVENT_DETAIL_BACK_SORTIR}
        </Link>
        <span className="min-w-0 truncate text-sm text-neutral-400">{categoryLabel}</span>
      </header>
      <EventDesktopHero
        title={title}
        imageUrls={imageUrls}
        compact
        galleryLabel={EVENT_DETAIL_MOBILE_GALLERY}
      />
    </div>
  );
}
