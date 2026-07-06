"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { NeighborhoodContributionModal } from "@/components/neighborhoods/v2/neighborhood-contribution-modal";
import { NeighborhoodMobileDetailActivityList } from "@/components/neighborhoods/mobile/neighborhood-mobile-detail-activity-list";
import { NeighborhoodMobileDetailFeaturedRail } from "@/components/neighborhoods/mobile/neighborhood-mobile-detail-featured-rail";
import { NeighborhoodMobileDetailJoinBanner } from "@/components/neighborhoods/mobile/neighborhood-mobile-detail-join-banner";
import { useNeighborhoodContributionSubmit } from "@/hooks/use-neighborhood-contribution-submit";
import type { NeighborhoodDetail } from "@yunicity/types";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_EVENTS_EMPTY,
  NEIGHBORHOOD_DETAIL_MOBILE_PLACES_EMPTY,
  NEIGHBORHOOD_DETAIL_MOBILE_PUBLICATIONS_EMPTY,
  NEIGHBORHOOD_DETAIL_MOBILE_TAB_EVENTS,
  NEIGHBORHOOD_DETAIL_MOBILE_TAB_FEATURED,
  NEIGHBORHOOD_DETAIL_MOBILE_TAB_INFO,
  NEIGHBORHOOD_DETAIL_MOBILE_TAB_PLACES,
  NEIGHBORHOOD_DETAIL_MOBILE_TAB_PUBLICATIONS,
  NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE,
  NEIGHBORHOOD_V2_EVENT_CTA,
  NEIGHBORHOOD_V2_HISTORY_TITLE,
  NEIGHBORHOOD_V2_PLACE_CTA,
  NEIGHBORHOOD_V2_PRACTICAL_MAP_CTA,
  NEIGHBORHOOD_V2_PRACTICAL_TITLE,
  NEIGHBORHOOD_V2_SHARE_MEMORY_CTA,
  buildNeighborhoodDetailMapUrl,
  buildPublicPlaceHref,
  formatEventDateRange,
  resolveNeighborhoodV2HistoryStoryForDisplay,
  selectApprovedContributionsForDisplay,
  type NeighborhoodMobileDetailTabId,
  type NeighborhoodMobileActivityItem,
  type NeighborhoodMobileFeaturedCard,
} from "@yunicity/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const TAB_OPTIONS: { id: NeighborhoodMobileDetailTabId; label: string }[] = [
  { id: "featured", label: NEIGHBORHOOD_DETAIL_MOBILE_TAB_FEATURED },
  { id: "events", label: NEIGHBORHOOD_DETAIL_MOBILE_TAB_EVENTS },
  { id: "places", label: NEIGHBORHOOD_DETAIL_MOBILE_TAB_PLACES },
  { id: "publications", label: NEIGHBORHOOD_DETAIL_MOBILE_TAB_PUBLICATIONS },
  { id: "info", label: NEIGHBORHOOD_DETAIL_MOBILE_TAB_INFO },
];

type NeighborhoodMobileDetailTabsProps = {
  detail: NeighborhoodDetail;
  featuredCards: NeighborhoodMobileFeaturedCard[];
  activityItems: NeighborhoodMobileActivityItem[];
  isMember?: boolean;
  onJoin?: () => void;
  joining?: boolean;
};

/** Onglets détail quartier mobile (MOBILE-QUARTIERS-02). */
export function NeighborhoodMobileDetailTabs({
  detail,
  featuredCards,
  activityItems,
  isMember = false,
  onJoin,
  joining = false,
}: NeighborhoodMobileDetailTabsProps) {
  const { user, yunicityApi } = useAuth();
  const [tab, setTab] = useState<NeighborhoodMobileDetailTabId>("featured");
  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasActivePassport, setHasActivePassport] = useState(false);

  const { status, errorMessage, submit, reset } = useNeighborhoodContributionSubmit({
    slug: detail.slug,
    city: detail.city,
  });

  const displayName = detail.hero?.display_name ?? detail.display_name;
  const contributions = selectApprovedContributionsForDisplay(detail.contributions);
  const history = resolveNeighborhoodV2HistoryStoryForDisplay(detail);

  const loadPassportEligibility = useCallback(async () => {
    if (!user) {
      setHasActivePassport(false);
      return;
    }
    try {
      const overview = await yunicityApi.getMyPassport();
      setHasActivePassport(overview.passport?.status === "active");
    } catch {
      setHasActivePassport(false);
    }
  }, [user, yunicityApi]);

  useEffect(() => {
    if (!modalOpen) return;
    void loadPassportEligibility();
  }, [loadPassportEligibility, modalOpen]);

  useEffect(() => {
    if (status !== "success") return;
    setSuccessMessage(NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE);
    setModalOpen(false);
    reset();
  }, [reset, status]);

  return (
    <div className="space-y-5">
      <div
        className="flex gap-0 overflow-x-auto border-b border-neutral-200/90 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Sections du quartier"
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

      {tab === "featured" ? (
        <div className="space-y-5">
          <NeighborhoodMobileDetailFeaturedRail items={featuredCards} />
          <NeighborhoodMobileDetailActivityList items={activityItems} />
          {!isMember && onJoin ? (
            <NeighborhoodMobileDetailJoinBanner
              displayName={displayName}
              onJoin={onJoin}
              joining={joining}
            />
          ) : null}
        </div>
      ) : null}

      {tab === "events" ? (
        <div id="neighborhood-mobile-explore" className="space-y-3">
          {detail.events.length === 0 ? (
            <p className="text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_MOBILE_EVENTS_EMPTY}</p>
          ) : (
            <ul className="space-y-3">
              {detail.events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${encodeURIComponent(event.id)}`}
                    className="flex gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {event.cover_image_url ? (
                        <CulturalImage
                          src={event.cover_image_url}
                          alt=""
                          placeName={event.title}
                          className="size-full object-cover"
                          sizes="64px"
                          showFallbackCaption={false}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-neutral-900">{event.title}</p>
                      <p className="mt-0.5 text-xs text-neutral-600">
                        {formatEventDateRange(event.starts_at, null)} · {event.location_name}
                      </p>
                      <span className="mt-2 inline-block text-xs font-semibold text-yunicity-primary">
                        {NEIGHBORHOOD_V2_EVENT_CTA}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "places" ? (
        <div className="space-y-3">
          {detail.places.length === 0 ? (
            <p className="text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_MOBILE_PLACES_EMPTY}</p>
          ) : (
            <ul className="space-y-3">
              {detail.places.map((place) => (
                <li key={place.id}>
                  <Link
                    href={buildPublicPlaceHref(place.slug, detail.city)}
                    className="flex gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {place.image_url ? (
                        <CulturalImage
                          src={place.image_url}
                          alt=""
                          placeName={place.name}
                          className="size-full object-cover"
                          sizes="64px"
                          showFallbackCaption={false}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-neutral-900">{place.name}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{place.category}</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-yunicity-primary">
                        {NEIGHBORHOOD_V2_PLACE_CTA}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "publications" ? (
        <div className="space-y-4">
          {successMessage ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </p>
          ) : null}
          {contributions.length === 0 ? (
            <p className="text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_MOBILE_PUBLICATIONS_EMPTY}</p>
          ) : (
            <NeighborhoodMobileDetailActivityList
              items={contributions.map((contribution) => ({
                id: contribution.id,
                authorLabel: contribution.author_label,
                body: contribution.body.trim(),
                dateLabel: contribution.approved_at
                  ? new Date(contribution.approved_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })
                  : null,
              }))}
            />
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white"
          >
            {NEIGHBORHOOD_V2_SHARE_MEMORY_CTA}
          </button>
        </div>
      ) : null}

      {tab === "info" ? (
        <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-4">
          <h2 className="text-base font-bold text-neutral-900">{NEIGHBORHOOD_V2_PRACTICAL_TITLE}</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Ville</dt>
              <dd className="mt-1 font-medium text-neutral-900">{detail.city}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Quartier</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayName}</dd>
            </div>
          </dl>
          {history?.long_story ? (
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{NEIGHBORHOOD_V2_HISTORY_TITLE}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{history.long_story}</p>
            </div>
          ) : null}
          <Link
            href={buildNeighborhoodDetailMapUrl(detail)}
            className="inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {NEIGHBORHOOD_V2_PRACTICAL_MAP_CTA} →
          </Link>
        </div>
      ) : null}

      <NeighborhoodContributionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        displayName={user?.full_name?.trim() || "Vous"}
        hasActivePassport={hasActivePassport}
        status={status}
        errorMessage={errorMessage}
        onSubmit={submit}
        onReset={reset}
      />
    </div>
  );
}
