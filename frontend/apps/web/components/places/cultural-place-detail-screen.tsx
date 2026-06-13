"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { PlacesAppShell } from "@/components/places/places-app-shell";
import { LocalVideoTeaserSection } from "@/components/videos/local-video-teaser-section";
import type { CulturalPlaceDetail } from "@yunicity/types";
import {
  MAP_CULTURE_ROUTE_CTA,
  PLACES_PORTAL_OPEN_MAP,
  culturalPlaceCategoryLabel,
  culturalPlaceLocationLine,
  culturalPlaceMapHref,
  resolveCulturalPlaceHeroUrl,
} from "@yunicity/utils";
import { ChevronLeft, MapPin, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type CulturalPlaceDetailScreenProps = {
  place: CulturalPlaceDetail;
};

export function CulturalPlaceDetailScreen({ place }: CulturalPlaceDetailScreenProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);
  const heroUrl = resolveCulturalPlaceHeroUrl(place);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: place.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint("Lien copié");
      setTimeout(() => setShareHint(null), 2000);
    } catch {
      /* annulation */
    }
  }

  return (
    <PlacesAppShell>
      <div className="mx-auto w-full max-w-[1100px] space-y-8 px-0 py-2 sm:py-4">
        <Link
          href={`/places?city=${encodeURIComponent(place.city)}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Lieux
        </Link>

        <article className="relative overflow-hidden rounded-3xl bg-neutral-950 shadow-lg">
          <div className="relative min-h-[280px] sm:min-h-[320px]">
            <CulturalImage
              src={heroUrl}
              alt={place.name}
              placeName={place.name}
              className="absolute inset-0 h-full w-full"
              sizes="(max-width: 1100px) 100vw"
              priority
              showFallbackCaption={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent" />
            <div className="relative flex min-h-[280px] flex-col justify-end p-6 sm:min-h-[320px] sm:p-8">
              <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                {culturalPlaceCategoryLabel(place.category)}
              </span>
              <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{place.name}</h1>
              <p className="mt-2 text-sm text-white/85">{culturalPlaceLocationLine(place)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={culturalPlaceMapHref(place.slug, place.city, true)}
                  className="inline-flex items-center gap-2 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  {MAP_CULTURE_ROUTE_CTA}
                </Link>
                <Link
                  href={culturalPlaceMapHref(place.slug, place.city)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  {PLACES_PORTAL_OPEN_MAP}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Share2 className="h-4 w-4" aria-hidden />
                  Partager
                </button>
                {shareHint ? <span className="self-center text-xs text-white/80">{shareHint}</span> : null}
              </div>
            </div>
          </div>
        </article>

        <LocalVideoTeaserSection
          city={place.city}
          filter={{ kind: "place", culturalPlaceSlug: place.slug }}
        />

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900">Informations pratiques</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">Catégorie</dt>
              <dd className="font-medium text-neutral-900">
                {culturalPlaceCategoryLabel(place.category)}
              </dd>
            </div>
            {place.neighborhood ? (
              <div>
                <dt className="text-neutral-500">Quartier</dt>
                <dd>
                  <Link
                    href={`/neighborhoods/${encodeURIComponent(place.neighborhood.slug)}?city=${encodeURIComponent(place.city)}`}
                    className="font-medium text-yunicity-primary hover:underline"
                  >
                    {place.neighborhood.display_name}
                  </Link>
                </dd>
              </div>
            ) : null}
            {place.address ? (
              <div className="sm:col-span-2">
                <dt className="text-neutral-500">Adresse</dt>
                <dd className="font-medium text-neutral-900">{place.address}</dd>
              </div>
            ) : null}
            {place.source_url ? (
              <div className="sm:col-span-2">
                <dt className="text-neutral-500">Source</dt>
                <dd>
                  <a
                    href={place.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-yunicity-primary hover:underline"
                  >
                    {place.source_name?.trim() || "En savoir plus"}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        {place.gallery_images.length > 0 ? (
          <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900">Galerie</h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {place.gallery_images.map((image, index) => (
                <li key={`${image.url}-${index}`} className="overflow-hidden rounded-xl bg-neutral-100">
                  <CulturalImage
                    src={image.url}
                    alt={image.alt ?? place.name}
                    placeName={place.name}
                    className="aspect-[4/3] w-full"
                    sizes="(max-width: 640px) 50vw, 240px"
                    showFallbackCaption={false}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {place.description ? (
          <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900">À propos</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {place.description}
            </p>
          </section>
        ) : null}
      </div>
    </PlacesAppShell>
  );
}
