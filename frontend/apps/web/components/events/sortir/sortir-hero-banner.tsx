"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { useGeo } from "@/providers/geo-provider";
import {
  SORTIR_NEW_USER_WELCOME,
  SORTIR_PORTAL_HERO_BODY,
  SORTIR_PORTAL_HERO_PREFIX,
  SORTIR_PORTAL_HERO_SUFFIX,
  SORTIR_PORTAL_LOCATION_AROUND,
} from "@yunicity/utils";
import type { SortirHeroStat } from "@yunicity/utils";
import { MapPin } from "lucide-react";

type SortirHeroBannerProps = {
  city: string;
  heroImageUrl: string | null;
  stats: SortirHeroStat[];
  isNewUser?: boolean;
};

export function SortirHeroBanner({
  city,
  heroImageUrl,
  stats,
  isNewUser = false,
}: SortirHeroBannerProps) {
  const geo = useGeo();
  const locationLabel = geo.currentCity?.trim() || city;

  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200/90 bg-[#0f172a] text-white shadow-sm">
      <div className="relative min-h-[220px] sm:min-h-[260px]">
        <CulturalImage
          src={heroImageUrl}
          alt={`Sorties et événements à ${city}`}
          placeName={city}
          className="absolute inset-0 size-full"
          imageClassName="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 960px"
          priority
          showFallbackCaption={false}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#0f172a]/75 to-[#0f172a]/35"
          aria-hidden
        />

        <div className="relative flex h-full flex-col justify-center px-6 py-8 sm:px-10 sm:py-10">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {SORTIR_PORTAL_HERO_PREFIX}{" "}
            <span className="uppercase">{city}</span>{" "}
            <span className="font-serif font-normal italic text-pink-300">{SORTIR_PORTAL_HERO_SUFFIX}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            {SORTIR_PORTAL_HERO_BODY}
          </p>

          {isNewUser ? (
            <p className="mt-2 text-sm font-medium text-pink-200">{SORTIR_NEW_USER_WELCOME}</p>
          ) : null}

          <ul className="mt-4 flex flex-wrap gap-2">
            {stats.map((stat) => (
              <li
                key={stat.id}
                className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/95 backdrop-blur-sm"
              >
                {stat.label}
              </li>
            ))}
          </ul>

          <p
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm text-neutral-800 shadow-sm"
            title="Ville issue de votre profil ou de votre position"
          >
            <MapPin className="h-4 w-4 text-yunicity-primary" aria-hidden />
            <span className="font-medium">{SORTIR_PORTAL_LOCATION_AROUND}</span>
            <span className="text-neutral-500" aria-hidden>
              ·
            </span>
            <span>{locationLabel}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
