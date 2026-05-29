"use client";

import {
  buildOrganizationRequestMapPreview,
  ORG_REQUEST_MAP_ADJUST,
  ORG_REQUEST_MAP_NOTE,
  ORG_REQUEST_MAP_TIP_BODY,
  ORG_REQUEST_MAP_TIP_TITLE,
} from "@yunicity/utils";
import { Lightbulb, MapPin } from "lucide-react";
import Link from "next/link";

type OrganizationRequestMapPreviewProps = {
  city: string;
  latitude?: number | null;
  longitude?: number | null;
};

export function OrganizationRequestMapPreview({
  city,
  latitude,
  longitude,
}: OrganizationRequestMapPreviewProps) {
  const preview = buildOrganizationRequestMapPreview({ city, latitude, longitude });
  const delta = 0.012;
  const bbox = [
    preview.longitude - delta,
    preview.latitude - delta,
    preview.longitude + delta,
    preview.latitude + delta,
  ].join("%2C");
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${preview.latitude}%2C${preview.longitude}`;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
        <iframe
          title="Aperçu cartographique"
          src={embedSrc}
          className="h-52 w-full border-0"
          loading="lazy"
        />
      </div>
      <Link
        href={preview.openMapHref}
        className="inline-flex items-center gap-2 text-sm font-semibold text-yunicity-primary hover:underline"
      >
        <MapPin className="h-4 w-4" aria-hidden />
        {ORG_REQUEST_MAP_ADJUST}
      </Link>
      <p className="text-xs text-neutral-500">{ORG_REQUEST_MAP_NOTE}</p>
      <div className="rounded-2xl bg-[#EEF0FF] p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-neutral-900">{ORG_REQUEST_MAP_TIP_TITLE}</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">{ORG_REQUEST_MAP_TIP_BODY}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
