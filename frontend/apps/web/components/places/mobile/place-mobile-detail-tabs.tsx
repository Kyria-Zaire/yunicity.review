"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { LocalVideoTeaserRail } from "@/components/videos/local-video-teaser-rail";
import { useLocalVideoTeasers } from "@/hooks/use-local-video-teasers";
import { PlaceMobileDetailMapPreview } from "@/components/places/mobile/place-mobile-detail-map-preview";
import type { CulturalPlaceDetail } from "@yunicity/types";
import {
  PLACE_DETAIL_MOBILE_ABOUT_EMPTY,
  PLACE_DETAIL_MOBILE_OFFERS_EMPTY,
  PLACE_DETAIL_MOBILE_PHOTOS_EMPTY,
  PLACE_DETAIL_MOBILE_PUBLICATIONS_EMPTY,
  PLACE_DETAIL_MOBILE_REVIEWS_EMPTY,
  PLACE_DETAIL_MOBILE_TAB_ABOUT,
  PLACE_DETAIL_MOBILE_TAB_OFFERS,
  PLACE_DETAIL_MOBILE_TAB_PHOTOS,
  PLACE_DETAIL_MOBILE_TAB_PUBLICATIONS,
  PLACE_DETAIL_MOBILE_TAB_REVIEWS,
  LOCAL_VIDEO_TEASER_SECTION_PLACE,
  buildPlaceMobileDetailAboutText,
  buildPlaceMobileDetailMapHref,
  type PlaceMobileDetailTabId,
} from "@yunicity/utils";
import { useState } from "react";

const TAB_OPTIONS: { id: PlaceMobileDetailTabId; label: string }[] = [
  { id: "about", label: PLACE_DETAIL_MOBILE_TAB_ABOUT },
  { id: "reviews", label: PLACE_DETAIL_MOBILE_TAB_REVIEWS },
  { id: "offers", label: PLACE_DETAIL_MOBILE_TAB_OFFERS },
  { id: "photos", label: PLACE_DETAIL_MOBILE_TAB_PHOTOS },
  { id: "publications", label: PLACE_DETAIL_MOBILE_TAB_PUBLICATIONS },
];

type PlaceMobileDetailTabsProps = {
  place: CulturalPlaceDetail;
  activeTab?: PlaceMobileDetailTabId;
  onTabChange?: (tab: PlaceMobileDetailTabId) => void;
};

/** Onglets détail lieu mobile (MOBILE-LIEUX-02). */
export function PlaceMobileDetailTabs({
  place,
  activeTab: controlledTab,
  onTabChange,
}: PlaceMobileDetailTabsProps) {
  const [internalTab, setInternalTab] = useState<PlaceMobileDetailTabId>("about");
  const tab = controlledTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const aboutText = buildPlaceMobileDetailAboutText(place);
  const mapHref = buildPlaceMobileDetailMapHref(place);
  const publications = useLocalVideoTeasers({
    city: place.city,
    filter: { kind: "place", culturalPlaceSlug: place.slug },
    enabled: tab === "publications",
  });

  return (
    <div className="space-y-5">
      <div
        className="flex gap-0 overflow-x-auto border-b border-neutral-200/90 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Sections du lieu"
      >
        {TAB_OPTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
              tab === item.id
                ? "border-yunicity-primary text-yunicity-primary"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "about" ? (
        <div className="space-y-5">
          {aboutText ? (
            <p className="text-sm leading-relaxed text-neutral-700">{aboutText}</p>
          ) : (
            <p className="text-sm text-neutral-500">{PLACE_DETAIL_MOBILE_ABOUT_EMPTY}</p>
          )}
          <PlaceMobileDetailMapPreview mapHref={mapHref} placeName={place.name} />
        </div>
      ) : null}

      {tab === "reviews" ? (
        <p className="text-sm text-neutral-500">{PLACE_DETAIL_MOBILE_REVIEWS_EMPTY}</p>
      ) : null}

      {tab === "offers" ? (
        <p className="text-sm text-neutral-500">{PLACE_DETAIL_MOBILE_OFFERS_EMPTY}</p>
      ) : null}

      {tab === "photos" ? (
        place.gallery_images.length === 0 ? (
          <p className="text-sm text-neutral-500">{PLACE_DETAIL_MOBILE_PHOTOS_EMPTY}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {place.gallery_images.map((image, index) => (
              <li key={`${image.url}-${index}`} className="overflow-hidden rounded-xl bg-neutral-100">
                <CulturalImage
                  src={image.url}
                  alt={image.alt ?? place.name}
                  placeName={place.name}
                  className="aspect-[4/3] w-full object-cover"
                  sizes="(max-width: 640px) 50vw, 240px"
                  showFallbackCaption={false}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "publications" ? (
        <div className="space-y-4">
          {publications.isLoading ? (
            <p className="text-sm text-neutral-500" role="status">
              Chargement…
            </p>
          ) : publications.isEmpty ? (
            <p className="text-sm text-neutral-500">{PLACE_DETAIL_MOBILE_PUBLICATIONS_EMPTY}</p>
          ) : (
            <LocalVideoTeaserRail
              items={publications.items}
              title={LOCAL_VIDEO_TEASER_SECTION_PLACE}
              layout="scroll"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
