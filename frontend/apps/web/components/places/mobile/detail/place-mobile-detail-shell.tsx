"use client";

import { PlaceDesktopDetailTabs } from "@/components/places/desktop/detail/place-desktop-detail-tabs";
import { PlaceMobileDetailAbout } from "@/components/places/mobile/detail/place-mobile-detail-about";
import { PlaceMobileDetailAddressCard } from "@/components/places/mobile/detail/place-mobile-detail-address-card";
import { PlaceMobileDetailContact } from "@/components/places/mobile/detail/place-mobile-detail-contact";
import { PlaceMobileDetailEvents } from "@/components/places/mobile/detail/place-mobile-detail-events";
import { PlaceMobileDetailGallery } from "@/components/places/mobile/detail/place-mobile-detail-gallery";
import { PlaceMobileDetailHours } from "@/components/places/mobile/detail/place-mobile-detail-hours";
import { PlaceMobileDetailKnowRail } from "@/components/places/mobile/detail/place-mobile-detail-know-rail";
import { PlaceMobileDetailMeta } from "@/components/places/mobile/detail/place-mobile-detail-meta";
import { PlaceMobileDetailNearby } from "@/components/places/mobile/detail/place-mobile-detail-nearby";
import { PlaceMobileDetailPhotosRail } from "@/components/places/mobile/detail/place-mobile-detail-photos-rail";
import { PlaceMobileDetailRelationCard } from "@/components/places/mobile/detail/place-mobile-detail-relation-card";
import { PlaceMobileDetailReportBand } from "@/components/places/mobile/detail/place-mobile-detail-report-band";
import { PlaceMobileDetailTabs } from "@/components/places/mobile/detail/place-mobile-detail-tabs";
import { PlaceMobileDetailWhy } from "@/components/places/mobile/detail/place-mobile-detail-why";
import { LocalVideoTeaserSection } from "@/components/videos/local-video-teaser-section";
import { usePlaceDetailContext } from "@/hooks/use-place-detail-context";
import type { CulturalPlaceDetail } from "@yunicity/types";
import type { PlaceDetailDesktopTabId } from "@yunicity/utils";
import {
  PLACE_DETAIL_MOBILE_BACK,
  PLACE_DETAIL_MOBILE_EVENTS_EMPTY,
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

type PlaceMobileDetailShellProps = {
  place: CulturalPlaceDetail;
};

/** Vue mobile détail lieu — maquette MOBILE-LIEUX-DETAIL-01 + bottom nav. */
export function PlaceMobileDetailShell({ place }: PlaceMobileDetailShellProps) {
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

  const overviewSections = (
    <div className="space-y-4">
      <PlaceMobileDetailAbout preview={aboutPreview} rest={aboutRest} />
      <PlaceMobileDetailWhy items={whyItems} />
      <PlaceMobileDetailKnowRail items={knowItems} />
      <PlaceMobileDetailHours hourRows={hourRows} />
      <PlaceMobileDetailContact place={place} />
      <PlaceMobileDetailPhotosRail
        title={place.name}
        imageUrls={galleryUrls}
        onOpenGallery={() => openGalleryRef.current(0)}
      />
      <PlaceMobileDetailEvents items={nowEvents} />
      <PlaceMobileDetailNearby items={nearbyPlaces} />
      <PlaceMobileDetailReportBand />
    </div>
  );

  return (
    <div
      className="place-mobile-detail-shell web-mobile-place-detail-only min-w-0 bg-[#F4F5F7] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      data-place-mobile-detail=""
    >
      <div className="space-y-4 bg-white px-4 pb-4 pt-3">
        <Link
          href={`/places?city=${encodeURIComponent(place.city)}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {PLACE_DETAIL_MOBILE_BACK}
        </Link>

        <PlaceMobileDetailGallery
          title={place.name}
          imageUrls={galleryUrls}
          onRegisterOpen={registerGalleryOpen}
        />

        <PlaceMobileDetailMeta place={place} badges={badges} subtitle={copy.subtitle} />
        <PlaceMobileDetailAddressCard place={place} />
        <PlaceMobileDetailRelationCard />
        <PlaceMobileDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="space-y-4 px-4 py-4">
        {activeTab === "overview" ? overviewSections : null}

        {activeTab === "practical" ? (
          <>
            <PlaceMobileDetailAddressCard place={place} />
            <PlaceMobileDetailHours hourRows={hourRows} />
            <PlaceMobileDetailContact place={place} />
            <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-neutral-500">Catégorie</dt>
                  <dd className="font-medium text-neutral-900">
                    {culturalPlaceCategoryLabel(place.category)}
                  </dd>
                </div>
                {quickInfo.map((item) => (
                  <div key={item.key}>
                    <dt className="text-neutral-500">{item.label}</dt>
                    <dd className="font-medium text-neutral-900">
                      {item.href ? (
                        <Link href={item.href} className="text-yunicity-primary">
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
            <PlaceMobileDetailReportBand />
          </>
        ) : null}

        {activeTab === "events" ? (
          nowEvents.length > 0 ? (
            <PlaceMobileDetailEvents items={nowEvents} />
          ) : (
            <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-600">
              {PLACE_DETAIL_MOBILE_EVENTS_EMPTY}
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
    </div>
  );
}
