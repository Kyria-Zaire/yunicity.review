"use client";

import { PlaceDesktopDetailPhotos } from "@/components/places/desktop/detail/place-desktop-detail-photos";
import { PlaceDesktopDetailTabs } from "@/components/places/desktop/detail/place-desktop-detail-tabs";
import { PlaceMediumDetailAboutWhy } from "@/components/places/medium/detail/place-medium-detail-about-why";
import { PlaceMediumDetailGallery } from "@/components/places/medium/detail/place-medium-detail-gallery";
import { PlaceMediumDetailInfoGrid } from "@/components/places/medium/detail/place-medium-detail-info-grid";
import { PlaceMediumDetailKnow } from "@/components/places/medium/detail/place-medium-detail-know";
import { PlaceMediumDetailMeta } from "@/components/places/medium/detail/place-medium-detail-meta";
import { PlaceMediumDetailMomentNearby } from "@/components/places/medium/detail/place-medium-detail-moment-nearby";
import { PlaceMediumDetailReportBand } from "@/components/places/medium/detail/place-medium-detail-report-band";
import { LocalVideoTeaserSection } from "@/components/videos/local-video-teaser-section";
import { usePlaceDetailContext } from "@/hooks/use-place-detail-context";
import type { CulturalPlaceDetail } from "@yunicity/types";
import type { PlaceDetailDesktopTabId } from "@yunicity/utils";
import {
  PLACE_DETAIL_MEDIUM_BACK,
  PLACE_DETAIL_MEDIUM_EVENTS_EMPTY,
  buildPlaceDetailDesktopBadges,
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

type PlaceMediumDetailViewProps = {
  place: CulturalPlaceDetail;
};

export function PlaceMediumDetailView({ place }: PlaceMediumDetailViewProps) {
  const [activeTab, setActiveTab] = useState<PlaceDetailDesktopTabId>("overview");
  const openGalleryRef = useRef<(index?: number) => void>(() => {});
  const { events: nowEvents, nearby: nearbyPlaces } = usePlaceDetailContext(place);

  const registerGalleryOpen = useCallback((open: (index?: number) => void) => {
    openGalleryRef.current = open;
  }, []);

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
      className="place-medium-detail-shell web-medium-place-detail-only mx-auto w-full max-w-[960px] space-y-5 px-3 py-2 pb-12 sm:px-4 sm:py-4"
      data-place-medium-detail=""
    >
      <Link
        href={`/places?city=${encodeURIComponent(place.city)}`}
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {PLACE_DETAIL_MEDIUM_BACK}
      </Link>

      <PlaceMediumDetailGallery
        title={place.name}
        imageUrls={galleryUrls}
        onRegisterOpen={registerGalleryOpen}
      />

      <PlaceMediumDetailMeta place={place} badges={badges} subtitle={copy.subtitle} />

      <PlaceDesktopDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <PlaceMediumDetailInfoGrid place={place} hourRows={hourRows} />
          <PlaceMediumDetailReportBand />
          <PlaceMediumDetailAboutWhy preview={aboutPreview} rest={aboutRest} whyItems={whyItems} />
          <PlaceMediumDetailKnow items={knowItems} />
          <PlaceDesktopDetailPhotos
            title={place.name}
            imageUrls={galleryUrls}
            onOpenGallery={() => openGalleryRef.current(0)}
          />
          <PlaceMediumDetailMomentNearby
            events={nowEvents}
            nearby={nearbyPlaces}
            city={place.city}
          />
        </div>
      ) : null}

      {activeTab === "practical" ? (
        <>
          <PlaceMediumDetailInfoGrid place={place} hourRows={hourRows} />
          <PlaceMediumDetailReportBand />
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
        </>
      ) : null}

      {activeTab === "events" ? (
        nowEvents.length > 0 ? (
          <PlaceMediumDetailMomentNearby events={nowEvents} nearby={[]} city={place.city} />
        ) : (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-600">
            {PLACE_DETAIL_MEDIUM_EVENTS_EMPTY}
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
  );
}
