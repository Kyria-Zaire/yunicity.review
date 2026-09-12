"use client";

import type { Neighborhood } from "@yunicity/types";
import {
  NEIGHBORHOODS_DESKTOP_MAP_BANNER_BODY,
  NEIGHBORHOODS_DESKTOP_MAP_BANNER_TITLE,
  NEIGHBORHOODS_DESKTOP_OPEN_MAP,
  buildNeighborhoodsDesktopMapCenter,
  buildNeighborhoodsDesktopMapPreviewUrl,
  buildOpenStreetMapEmbedUrl,
} from "@yunicity/utils";
import { Map } from "lucide-react";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type NeighborhoodsDesktopMapBannerProps = {
  mapHref: string;
  neighborhoods: Neighborhood[];
  title?: string;
  body?: string;
};

function MapPlaceholder() {
  return (
    <div
      className="relative min-h-[160px] bg-[linear-gradient(135deg,#EEF0FF_0%,#F8F1E7_45%,#E8F6EF_100%)]"
      aria-hidden
    >
      <div className="absolute inset-6 rounded-2xl border border-white/70 bg-white/40 shadow-inner">
        <span className="absolute left-[18%] top-[28%] h-10 w-14 rounded-lg bg-violet-300/80" />
        <span className="absolute left-[42%] top-[40%] h-12 w-16 rounded-lg bg-orange-300/80" />
        <span className="absolute left-[28%] top-[58%] h-8 w-12 rounded-lg bg-emerald-300/80" />
        <span className="absolute left-[58%] top-[24%] h-9 w-10 rounded-lg bg-sky-300/80" />
      </div>
    </div>
  );
}

export function NeighborhoodsDesktopMapBanner({
  mapHref,
  neighborhoods,
  title = NEIGHBORHOODS_DESKTOP_MAP_BANNER_TITLE,
  body = NEIGHBORHOODS_DESKTOP_MAP_BANNER_BODY,
}: NeighborhoodsDesktopMapBannerProps) {
  const previewUrl = buildNeighborhoodsDesktopMapPreviewUrl(neighborhoods, MAPBOX_TOKEN, {
    width: 640,
    height: 280,
  });
  const center = buildNeighborhoodsDesktopMapCenter(neighborhoods);
  const osmEmbedUrl = center
    ? buildOpenStreetMapEmbedUrl(center.latitude, center.longitude, 0.04)
    : null;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-neighborhoods-desktop-map-banner=""
    >
      <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative min-h-[140px] overflow-hidden bg-neutral-100 sm:min-h-[160px]">
          {previewUrl ? (
            <Link href={mapHref} className="absolute inset-0 block" aria-label={NEIGHBORHOODS_DESKTOP_OPEN_MAP}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </Link>
          ) : osmEmbedUrl ? (
            <Link href={mapHref} className="absolute inset-0 block" aria-label={NEIGHBORHOODS_DESKTOP_OPEN_MAP}>
              <iframe
                title={title}
                src={osmEmbedUrl}
                className="pointer-events-none absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Link>
          ) : (
            <MapPlaceholder />
          )}
        </div>
        <div className="flex flex-col justify-center gap-3 p-4 sm:p-6">
          <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">{title}</h2>
          <p className="max-w-md text-sm leading-relaxed text-neutral-600">{body}</p>
          <Link
            href={mapHref}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl border border-yunicity-primary/35 bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          >
            <Map className="h-4 w-4" aria-hidden />
            {NEIGHBORHOODS_DESKTOP_OPEN_MAP}
          </Link>
        </div>
      </div>
    </section>
  );
}
