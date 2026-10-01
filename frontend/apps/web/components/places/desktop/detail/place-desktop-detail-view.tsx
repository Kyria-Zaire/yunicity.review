"use client";

import { PlaceDetailBreadcrumbs } from "@/components/places/place-detail-breadcrumbs";
import { PlaceDesktopDetailAbout } from "@/components/places/desktop/detail/place-desktop-detail-about";
import { PlaceDesktopDetailEvents } from "@/components/places/desktop/detail/place-desktop-detail-events";
import { PlaceDesktopDetailGallery } from "@/components/places/desktop/detail/place-desktop-detail-gallery";
import { PlaceDesktopDetailKnow } from "@/components/places/desktop/detail/place-desktop-detail-know";
import { PlaceDesktopDetailMeta } from "@/components/places/desktop/detail/place-desktop-detail-meta";
import { PlaceDesktopDetailNearby } from "@/components/places/desktop/detail/place-desktop-detail-nearby";
import { PlaceDesktopDetailPhotos } from "@/components/places/desktop/detail/place-desktop-detail-photos";
import { PlaceDesktopDetailRightRail } from "@/components/places/desktop/detail/place-desktop-detail-right-rail";
import { PlaceDesktopDetailTabs } from "@/components/places/desktop/detail/place-desktop-detail-tabs";
import { PlaceDesktopDetailWhy } from "@/components/places/desktop/detail/place-desktop-detail-why";
import { LocalVideoTeaserSection } from "@/components/videos/local-video-teaser-section";
import { usePlaceDetailContext } from "@/hooks/use-place-detail-context";
import type { CulturalPlaceDetail } from "@yunicity/types";
import type { PlaceDetailDesktopTabId } from "@yunicity/utils";
import {
  PLACE_DETAIL_DESKTOP_BACK,
  PLACE_DETAIL_DESKTOP_EVENTS_EMPTY,
  buildPlaceDetailDesktopBadges,
  buildPlaceDetailDesktopBreadcrumbs,
  buildPlaceDetailDesktopGalleryUrls,
  buildPlaceDetailDesktopHourRows,
  buildPlaceDetailDesktopKnowItems,
  buildPlaceDetailDesktopWhyItems,
  buildPlaceMobileDetailAboutText,
  buildPlaceMobileDetailQuickInfo,
  culturalPlaceCategoryLabel,
  splitPlaceDesktopCopy,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

type PlaceDesktopDetailViewProps = {
  place: CulturalPlaceDetail;
};

export function PlaceDesktopDetailView({ place }: PlaceDesktopDetailViewProps) {
  const [activeTab, setActiveTab] = useState<PlaceDetailDesktopTabId>("overview");
  const openGalleryRef = useRef<(index?: number) => void>(() => {});
  const { events: nowEvents, nearby: nearbyPlaces } = usePlaceDetailContext(place);

  const registerGalleryOpen = useCallback((open: (index?: number) => void) => {
    openGalleryRef.current = open;
  }, []);

  const breadcrumbs = useMemo(() => buildPlaceDetailDesktopBreadcrumbs(place), [place]);
  const galleryUrls = useMemo(() => buildPlaceDetailDesktopGalleryUrls(place), [place]);
  const badges = useMemo(() => buildPlaceDetailDesktopBadges(place), [place]);
  const copy = useMemo(() => splitPlaceDesktopCopy(place), [place]);
  const knowItems = useMemo(() => buildPlaceDetailDesktopKnowItems(place), [place]);
  const whyItems = useMemo(() => buildPlaceDetailDesktopWhyItems(place), [place]);
  const hourRows = useMemo(() => buildPlaceDetailDesktopHourRows(place), [place]);
  const quickInfo = useMemo(() => buildPlaceMobileDetailQuickInfo(place), [place]);
  const aboutFallback = useMemo(() => buildPlaceMobileDetailAboutText(place), [place]);

  const aboutPreview = copy.preview || aboutFallback || "";
  const aboutRest = copy.rest;

  return (
    <div
      className="place-desktop-detail-shell web-desktop-place-detail-only mx-auto w-full max-w-[1200px] space-y-5 px-3 py-2 sm:px-4 sm:py-4"
      data-place-desktop-detail=""
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={`/places?city=${encodeURIComponent(place.city)}`}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {PLACE_DETAIL_DESKTOP_BACK}
        </Link>
        <PlaceDetailBreadcrumbs items={breadcrumbs} />
      </div>

      <PlaceDesktopDetailGallery
        title={place.name}
        imageUrls={galleryUrls}
        onRegisterOpen={registerGalleryOpen}
      />

      <PlaceDesktopDetailMeta place={place} badges={badges} subtitle={copy.subtitle} />

      <PlaceDesktopDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="place-desktop-detail-grid gap-6">
        <div className="min-w-0 space-y-8">
          {activeTab === "overview" ? (
            <>
              <PlaceDesktopDetailAbout preview={aboutPreview} rest={aboutRest} />
              <PlaceDesktopDetailKnow items={knowItems} />
              <PlaceDesktopDetailWhy items={whyItems} />
              <div id="place-desktop-detail-gallery-anchor">
                <PlaceDesktopDetailPhotos
                  title={place.name}
                  imageUrls={galleryUrls}
                  onOpenGallery={() => openGalleryRef.current(0)}
                />
              </div>
              <PlaceDesktopDetailEvents items={nowEvents} city={place.city} />
              <PlaceDesktopDetailNearby items={nearbyPlaces} city={place.city} />
            </>
          ) : null}

          {activeTab === "practical" ? (
            <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
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
                {quickInfo.map((item) => (
                  <div key={item.key} className={item.key === "address" ? "sm:col-span-2" : ""}>
                    <dt className="text-neutral-500">{item.label}</dt>
                    <dd className="font-medium text-neutral-900">
                      {item.href ? (
                        <Link href={item.href} className="text-yunicity-primary hover:underline">
                          {item.value}
                        </Link>
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {activeTab === "events" ? (
            nowEvents.length > 0 ? (
              <PlaceDesktopDetailEvents items={nowEvents} city={place.city} />
            ) : (
              <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-600">
                {PLACE_DETAIL_DESKTOP_EVENTS_EMPTY}
              </p>
            )
          ) : null}

          {activeTab === "publications" ? (
            <LocalVideoTeaserSection
              city={place.city}
              filter={{ kind: "place", culturalPlaceSlug: place.slug }}
            />
          ) : null}
        </div>

        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <PlaceDesktopDetailRightRail place={place} hourRows={hourRows} />
        </div>
      </div>
    </div>
  );
}
