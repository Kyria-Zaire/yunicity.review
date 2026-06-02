"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import {
  NEIGHBORHOODS_PORTAL_HERO_CTA_MAP,
  NEIGHBORHOODS_PORTAL_HERO_SUBTITLE,
  NEIGHBORHOODS_PORTAL_HERO_TITLE,
  NEIGHBORHOODS_PORTAL_KICKER,
} from "@yunicity/utils";
import { Map } from "lucide-react";
import Link from "next/link";

type NeighborhoodsHeroBannerProps = {
  city: string;
  heroImageUrl: string | null;
};

export function NeighborhoodsHeroBanner({ city, heroImageUrl }: NeighborhoodsHeroBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-200/90 bg-neutral-950 text-white shadow-sm">
      <div className="relative min-h-[280px] sm:min-h-[320px]">
        <CulturalImage
          src={heroImageUrl}
          alt={`Quartiers de ${city}`}
          placeName={city}
          className="absolute inset-0 size-full"
          imageClassName="origin-center scale-[0.94] object-cover object-center"
          sizes="(max-width: 1280px) 100vw, 960px"
          priority
          showFallbackCaption={false}
          overlay={false}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
          aria-hidden
        />

        <div className="relative flex min-h-[280px] flex-col justify-end p-6 sm:min-h-[320px] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">
            {NEIGHBORHOODS_PORTAL_KICKER}
          </p>
          <h1 className="mt-2 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            {NEIGHBORHOODS_PORTAL_HERO_TITLE}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/88 sm:text-base">
            {NEIGHBORHOODS_PORTAL_HERO_SUBTITLE}
          </p>
          <div className="mt-5">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
            >
              <Map className="h-4 w-4" aria-hidden />
              {NEIGHBORHOODS_PORTAL_HERO_CTA_MAP}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
