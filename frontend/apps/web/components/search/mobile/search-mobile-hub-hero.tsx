"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { LocalWeatherHeroCard } from "@/components/weather/local-weather-hero-card";
import {
  SEARCH_EXPLORER_HERO_BODY,
  SEARCH_EXPLORER_HERO_CTA,
  SEARCH_EXPLORER_HERO_KICKER,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

type SearchMobileHubHeroProps = {
  city: string;
  heroImageUrl: string | null;
};

/** Bandeau hub + météo — parité données desktop, layout mobile MOBILE-SEARCH-01. */
export function SearchMobileHubHero({ city, heroImageUrl }: SearchMobileHubHeroProps) {
  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <div className="relative aspect-[2.2/1] min-h-[9.5rem] w-full overflow-hidden bg-neutral-800">
          <CulturalImage
            src={heroImageUrl}
            alt={`${SEARCH_EXPLORER_HERO_KICKER} ${city}`}
            placeName={city}
            className="absolute inset-0 size-full"
            imageClassName="object-[center_28%]"
            sizes="100vw"
            priority
            showFallbackCaption={false}
            overlay={false}
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/35 to-black/20"
            aria-hidden
          />
          <div className="absolute inset-0 z-[2] flex flex-col justify-end p-4">
            <h2 className="text-lg font-bold tracking-tight text-white">
              {SEARCH_EXPLORER_HERO_KICKER}{" "}
              <span className="text-white">{city}</span>
            </h2>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/90">
              {SEARCH_EXPLORER_HERO_BODY}
            </p>
            <Link
              href={`/map?city=${encodeURIComponent(city)}`}
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-[#FF2D78] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {SEARCH_EXPLORER_HERO_CTA}
            </Link>
          </div>
        </div>
      </section>

      <LocalWeatherHeroCard city={city} variant="compact" />
    </div>
  );
}
