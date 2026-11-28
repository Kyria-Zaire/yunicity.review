"use client";

import type { Neighborhood } from "@yunicity/types";
import {
  buildNeighborhoodDetailMapPreviewUrl,
  buildOpenStreetMapEmbedUrl,
  neighborhoodHasMapCoordinates,
} from "@yunicity/utils";
import { MapPinned } from "lucide-react";
import Link from "next/link";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

type NeighborhoodDetailMapPreviewProps = {
  detail: Neighborhood;
  mapHref: string;
  title: string;
  heightClassName?: string;
};

export function NeighborhoodDetailMapPreview({
  detail,
  mapHref,
  title,
  heightClassName = "h-32 sm:h-36",
}: NeighborhoodDetailMapPreviewProps) {
  const previewUrl = buildNeighborhoodDetailMapPreviewUrl(detail, [], MAPBOX_TOKEN, {
    width: 520,
    height: 260,
  });
  const osmEmbedUrl = neighborhoodHasMapCoordinates(detail)
    ? buildOpenStreetMapEmbedUrl(detail.latitude!, detail.longitude!, 0.02)
    : null;

  if (previewUrl) {
    return (
      <Link href={mapHref} className={`relative block overflow-hidden ${heightClassName}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
      </Link>
    );
  }

  if (osmEmbedUrl) {
    return (
      <Link href={mapHref} className={`relative block overflow-hidden ${heightClassName}`}>
        <iframe
          title={title}
          src={osmEmbedUrl}
          className="pointer-events-none absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </Link>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-neutral-50 text-neutral-400 ${heightClassName}`}>
      <MapPinned className="h-7 w-7" aria-hidden />
    </div>
  );
}
