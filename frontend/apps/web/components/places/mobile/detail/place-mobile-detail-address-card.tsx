"use client";

import type { CulturalPlaceDetail } from "@yunicity/types";
import {
  PLACE_DETAIL_MOBILE_ADDRESS_TITLE,
  PLACE_DETAIL_MOBILE_OPEN_MAP,
  PLACE_DETAIL_MOBILE_ROUTE,
  buildMapboxStaticPreviewUrl,
  buildOpenStreetMapEmbedUrl,
  buildPlaceDetailDesktopMapHref,
} from "@yunicity/utils";
import { MapPin, Navigation } from "lucide-react";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type PlaceMobileDetailAddressCardProps = {
  place: CulturalPlaceDetail;
};

function MapPreview({ place }: { place: CulturalPlaceDetail }) {
  const previewUrl =
    place.latitude && place.longitude
      ? buildMapboxStaticPreviewUrl(place.latitude, place.longitude, MAPBOX_TOKEN, {
          width: 640,
          height: 220,
        })
      : null;
  const embedSrc =
    place.latitude && place.longitude
      ? buildOpenStreetMapEmbedUrl(place.latitude, place.longitude)
      : null;

  if (previewUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={previewUrl} alt="" className="h-full w-full object-cover" />
    );
  }

  if (embedSrc) {
    return (
      <iframe
        title={`Carte ${place.name}`}
        src={embedSrc}
        className="h-full w-full border-0"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#E8F4FC_0%,#D4E8F7_100%)] text-neutral-400">
      <MapPin className="h-8 w-8" aria-hidden />
    </div>
  );
}

export function PlaceMobileDetailAddressCard({ place }: PlaceMobileDetailAddressCardProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-place-mobile-detail-address=""
    >
      <h2 className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
        {PLACE_DETAIL_MOBILE_ADDRESS_TITLE}
      </h2>
      <div className="p-4">
        <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-xl bg-neutral-100">
          <MapPreview place={place} />
        </div>
        {place.address ? (
          <p className="inline-flex items-start gap-1.5 text-sm font-medium text-neutral-800">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {place.address}
          </p>
        ) : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href={buildPlaceDetailDesktopMapHref(place)}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-2 text-xs font-semibold text-yunicity-primary"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {PLACE_DETAIL_MOBILE_OPEN_MAP}
          </Link>
          <Link
            href={buildPlaceDetailDesktopMapHref(place, true)}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-2 text-xs font-semibold text-neutral-800"
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            {PLACE_DETAIL_MOBILE_ROUTE}
          </Link>
        </div>
      </div>
    </section>
  );
}
