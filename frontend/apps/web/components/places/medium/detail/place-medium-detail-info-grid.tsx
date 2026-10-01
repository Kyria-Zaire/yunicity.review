"use client";

import type { CulturalPlaceDetail } from "@yunicity/types";
import type { PlaceDetailDesktopHourRow } from "@yunicity/utils";
import {
  PLACE_DETAIL_MEDIUM_ACCESSIBLE,
  PLACE_DETAIL_MEDIUM_ADDRESS_TITLE,
  PLACE_DETAIL_MEDIUM_CONTACT_CALL,
  PLACE_DETAIL_MEDIUM_CONTACT_OFFICIAL,
  PLACE_DETAIL_MEDIUM_CONTACT_TITLE,
  PLACE_DETAIL_MEDIUM_HOURS_EMPTY,
  PLACE_DETAIL_MEDIUM_HOURS_FOOTER,
  PLACE_DETAIL_MEDIUM_HOURS_TITLE,
  PLACE_DETAIL_MEDIUM_HOURS_TODAY,
  PLACE_DETAIL_MEDIUM_HOURS_VIEW_ALL,
  PLACE_DETAIL_MEDIUM_OPEN_MAP,
  PLACE_DETAIL_MEDIUM_RELATION_EMPTY,
  PLACE_DETAIL_MEDIUM_RELATION_TITLE,
  PLACE_DETAIL_MEDIUM_ROUTE,
  PLACE_DETAIL_MEDIUM_SAVE,
  PLACE_DETAIL_MEDIUM_SAVE_SOON,
  PLACE_DETAIL_MEDIUM_VISITED,
  PLACE_DETAIL_MEDIUM_VISITED_SOON,
  buildMapboxStaticPreviewUrl,
  buildOpenStreetMapEmbedUrl,
  buildPlaceDetailDesktopMapHref,
  buildPlaceMobileDetailQuickInfo,
} from "@yunicity/utils";
import {
  Accessibility,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Globe,
  MapPin,
  Phone,
} from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type PlaceMediumDetailInfoGridProps = {
  place: CulturalPlaceDetail;
  hourRows: PlaceDetailDesktopHourRow[];
};

function PlaceMediumMapPreview({ place }: { place: CulturalPlaceDetail }) {
  const previewUrl =
    place.latitude && place.longitude
      ? buildMapboxStaticPreviewUrl(place.latitude, place.longitude, MAPBOX_TOKEN, {
          width: 640,
          height: 180,
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

function InfoCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm ${className}`}
    >
      <h2 className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
        {title}
      </h2>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PlaceMediumDetailInfoGrid({ place, hourRows }: PlaceMediumDetailInfoGridProps) {
  const quickInfo = buildPlaceMobileDetailQuickInfo(place);
  const website = quickInfo.find((item) => item.key === "website");
  const hoursEmpty = hourRows.length === 0;

  return (
    <div className="place-medium-detail-info-grid gap-4" data-place-medium-detail-info-grid="">
      <InfoCard title={PLACE_DETAIL_MEDIUM_ADDRESS_TITLE}>
        <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-xl bg-neutral-100">
          <PlaceMediumMapPreview place={place} />
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
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-2 text-xs font-semibold text-yunicity-primary sm:text-sm"
          >
            {PLACE_DETAIL_MEDIUM_OPEN_MAP}
          </Link>
          <Link
            href={buildPlaceDetailDesktopMapHref(place, true)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-neutral-200 px-2 text-xs font-semibold text-neutral-800 sm:text-sm"
          >
            {PLACE_DETAIL_MEDIUM_ROUTE}
          </Link>
        </div>
      </InfoCard>

      <InfoCard title={PLACE_DETAIL_MEDIUM_RELATION_TITLE}>
        <p className="text-sm text-neutral-600">{PLACE_DETAIL_MEDIUM_RELATION_EMPTY}</p>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            disabled
            title={PLACE_DETAIL_MEDIUM_SAVE_SOON}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white opacity-90"
          >
            <Bookmark className="h-4 w-4" aria-hidden />
            {PLACE_DETAIL_MEDIUM_SAVE}
          </button>
          <button
            type="button"
            disabled
            title={PLACE_DETAIL_MEDIUM_VISITED_SOON}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {PLACE_DETAIL_MEDIUM_VISITED}
          </button>
        </div>
      </InfoCard>

      <InfoCard title={PLACE_DETAIL_MEDIUM_HOURS_TITLE}>
        {!hoursEmpty ? (
          <>
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
              {PLACE_DETAIL_MEDIUM_HOURS_TODAY}
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              {hourRows.map((row) => (
                <div key={row.day} className="flex justify-between gap-3">
                  <dt className="text-neutral-500">{row.day}</dt>
                  <dd className="font-medium text-neutral-900">{row.hours}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              disabled
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary opacity-70"
            >
              {PLACE_DETAIL_MEDIUM_HOURS_VIEW_ALL}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </>
        ) : (
          <p className="text-sm text-neutral-600">{PLACE_DETAIL_MEDIUM_HOURS_EMPTY}</p>
        )}
        <p className="mt-3 text-xs text-neutral-500">{PLACE_DETAIL_MEDIUM_HOURS_FOOTER}</p>
      </InfoCard>

      <InfoCard title={PLACE_DETAIL_MEDIUM_CONTACT_TITLE}>
        <ul className="space-y-3 text-sm">
          {website?.href ? (
            <li className="flex items-start gap-2">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              <div>
                <p className="font-medium text-neutral-500">{PLACE_DETAIL_MEDIUM_CONTACT_OFFICIAL}</p>
                <a
                  href={website.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-yunicity-primary hover:underline"
                >
                  {website.value}
                </a>
              </div>
            </li>
          ) : null}
          <li className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
            <div>
              <p className="font-medium text-neutral-500">{PLACE_DETAIL_MEDIUM_CONTACT_CALL}</p>
              <p className="text-neutral-600">Information à confirmer sur place.</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Accessibility className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <div>
              <p className="font-semibold text-neutral-900">{PLACE_DETAIL_MEDIUM_ACCESSIBLE}</p>
              <p className="text-neutral-600">Information à confirmer sur place.</p>
            </div>
          </li>
        </ul>
      </InfoCard>
    </div>
  );
}
