"use client";

import type { CulturalPlaceDetail } from "@yunicity/types";
import type { PlaceDetailDesktopHourRow } from "@yunicity/utils";
import {
  PLACE_DETAIL_DESKTOP_ACCESSIBLE,
  PLACE_DETAIL_DESKTOP_ADDRESS_TITLE,
  PLACE_DETAIL_DESKTOP_CONTACT_TITLE,
  PLACE_DETAIL_DESKTOP_HOURS_TITLE,
  PLACE_DETAIL_DESKTOP_HOURS_TODAY,
  PLACE_DETAIL_DESKTOP_HOURS_VIEW_ALL,
  PLACE_DETAIL_DESKTOP_OPEN_MAP,
  PLACE_DETAIL_DESKTOP_RELATION_EMPTY,
  PLACE_DETAIL_DESKTOP_RELATION_TITLE,
  PLACE_DETAIL_DESKTOP_REPORT_CHANGE,
  PLACE_DETAIL_DESKTOP_REPORT_SOON,
  PLACE_DETAIL_DESKTOP_REPORT_SUGGEST,
  PLACE_DETAIL_DESKTOP_REPORT_TITLE,
  PLACE_DETAIL_DESKTOP_ROUTE,
  PLACE_DETAIL_DESKTOP_SAVE,
  PLACE_DETAIL_DESKTOP_SAVE_SOON,
  PLACE_DETAIL_DESKTOP_TRUST_FOOTER,
  PLACE_DETAIL_DESKTOP_VISITED,
  PLACE_DETAIL_DESKTOP_VISITED_SOON,
  PLACE_DETAIL_DESKTOP_WEBSITE,
  buildMapboxStaticPreviewUrl,
  buildOpenStreetMapEmbedUrl,
  buildPlaceDetailDesktopMapHref,
  buildPlaceMobileDetailQuickInfo,
  placeDetailDesktopHoursEmptyMessage,
} from "@yunicity/utils";
import {
  Accessibility,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Globe,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type PlaceDesktopDetailRightRailProps = {
  place: CulturalPlaceDetail;
  hourRows: PlaceDetailDesktopHourRow[];
};

function PlaceDetailMapPreview({ place }: { place: CulturalPlaceDetail }) {
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

export function PlaceDesktopDetailRightRail({ place, hourRows }: PlaceDesktopDetailRightRailProps) {
  const quickInfo = buildPlaceMobileDetailQuickInfo(place);
  const website = quickInfo.find((item) => item.key === "website");
  const hoursEmpty = hourRows.length === 0;

  return (
    <aside className="space-y-4" data-place-desktop-detail-right-rail="">
      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
          {PLACE_DETAIL_DESKTOP_ADDRESS_TITLE}
        </h2>
        <div className="p-4">
          <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-xl bg-neutral-100">
            <PlaceDetailMapPreview place={place} />
          </div>
          {place.address ? (
            <p className="text-sm font-medium text-neutral-800">{place.address}</p>
          ) : null}
          <div className="mt-3 grid gap-2">
            <Link
              href={buildPlaceDetailDesktopMapHref(place)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-yunicity-primary"
            >
              <MapPin className="h-4 w-4" aria-hidden />
              {PLACE_DETAIL_DESKTOP_OPEN_MAP}
            </Link>
            <Link
              href={buildPlaceDetailDesktopMapHref(place, true)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-800"
            >
              {PLACE_DETAIL_DESKTOP_ROUTE}
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
          {PLACE_DETAIL_DESKTOP_HOURS_TITLE}
        </h2>
        <div className="space-y-3 p-4">
          {!hoursEmpty ? (
            <>
              <p className="text-sm font-medium text-emerald-700">{PLACE_DETAIL_DESKTOP_HOURS_TODAY}</p>
              <dl className="space-y-1.5 text-sm">
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
                className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary opacity-70"
              >
                {PLACE_DETAIL_DESKTOP_HOURS_VIEW_ALL}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </>
          ) : (
            <p className="text-sm text-neutral-600">{placeDetailDesktopHoursEmptyMessage(place)}</p>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
          {PLACE_DETAIL_DESKTOP_RELATION_TITLE}
        </h2>
        <div className="space-y-3 p-4">
          <p className="text-sm text-neutral-600">{PLACE_DETAIL_DESKTOP_RELATION_EMPTY}</p>
          <button
            type="button"
            disabled
            title={PLACE_DETAIL_DESKTOP_SAVE_SOON}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white opacity-90"
          >
            <Bookmark className="h-4 w-4" aria-hidden />
            {PLACE_DETAIL_DESKTOP_SAVE}
          </button>
          <button
            type="button"
            disabled
            title={PLACE_DETAIL_DESKTOP_VISITED_SOON}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-800"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {PLACE_DETAIL_DESKTOP_VISITED}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
          {PLACE_DETAIL_DESKTOP_CONTACT_TITLE}
        </h2>
        <ul className="space-y-3 p-4 text-sm">
          {website?.href ? (
            <li className="flex items-start gap-2">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
              <div>
                <p className="font-medium text-neutral-500">{PLACE_DETAIL_DESKTOP_WEBSITE}</p>
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
            <Accessibility className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <div>
              <p className="font-semibold text-neutral-900">{PLACE_DETAIL_DESKTOP_ACCESSIBLE}</p>
              <p className="text-neutral-600">Information à confirmer sur place.</p>
            </div>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PLACE_DETAIL_DESKTOP_REPORT_TITLE}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            title={PLACE_DETAIL_DESKTOP_REPORT_SOON}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-xs font-semibold text-neutral-800"
          >
            {PLACE_DETAIL_DESKTOP_REPORT_CHANGE}
          </button>
          <button
            type="button"
            disabled
            title={PLACE_DETAIL_DESKTOP_REPORT_SOON}
            className="rounded-xl border border-neutral-200 px-3 py-2.5 text-xs font-semibold text-neutral-800"
          >
            {PLACE_DETAIL_DESKTOP_REPORT_SUGGEST}
          </button>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-neutral-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          {PLACE_DETAIL_DESKTOP_TRUST_FOOTER}
        </p>
      </section>
    </aside>
  );
}
