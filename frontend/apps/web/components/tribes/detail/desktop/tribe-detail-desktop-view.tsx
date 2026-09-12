"use client";

import { TribeDetailBreadcrumbs } from "@/components/tribes/tribe-detail-breadcrumbs";
import { TribeDetailDesktopDiscussions } from "@/components/tribes/detail/desktop/tribe-detail-desktop-discussions";
import { TribeDetailDesktopFeatured } from "@/components/tribes/detail/desktop/tribe-detail-desktop-featured";
import { TribeDetailDesktopHero } from "@/components/tribes/detail/desktop/tribe-detail-desktop-hero";
import { TribeDetailDesktopJoinBanner } from "@/components/tribes/detail/desktop/tribe-detail-desktop-join-banner";
import { TribeDetailDesktopNextEvent } from "@/components/tribes/detail/desktop/tribe-detail-desktop-next-event";
import { TribeDetailDesktopProjectsGallery } from "@/components/tribes/detail/desktop/tribe-detail-desktop-projects-gallery";
import { TribeDetailDesktopRightRail } from "@/components/tribes/detail/desktop/tribe-detail-desktop-right-rail";
import { TribeDetailSectionNav } from "@/components/tribes/detail/shared";
import { TribeDetailEventsSection } from "@/components/tribes/tribe-detail-events-section";
import { TribeEditForm } from "@/components/tribes/tribe-edit-form";
import { TribeJoinRequestButton } from "@/components/tribes/tribe-join-request-button";
import { TribeJoinRequestsSection } from "@/components/tribes/tribe-join-requests-section";
import { TribeMembersSection } from "@/components/tribes/tribe-members-section";
import { TribeModerationPanel } from "@/components/tribes/tribe-moderation-panel";
import { TribeWallSection } from "@/components/tribes/tribe-wall-section";
import { useTribeDetailSectionScroll } from "@/hooks/use-tribe-detail-section-scroll";
import type { CulturalPlaceListItem, FeedPost, LocalEvent, Tribe, TribeMember } from "@yunicity/types";
import {
  TRIBE_ARCHIVED_BODY,
  TRIBE_ARCHIVED_TITLE,
  TRIBE_DETAIL_DESKTOP_BACK,
  TRIBE_DETAIL_DESKTOP_TABS,
  TRIBE_PRIVATE_BODY,
  TRIBE_PRIVATE_TITLE,
  buildTribeDetailBreadcrumbs,
  buildTribeDetailDesktopEssentialRules,
  buildTribeDetailDesktopFeaturedCard,
  buildTribeDetailDesktopGalleryUrls,
  buildTribeDetailDesktopJoinBenefits,
  buildTribeDetailDesktopLocationMeta,
  buildTribeDetailDesktopProjectUrls,
  buildTribeDetailEventCards,
  buildTribeDetailPostCards,
  buildTribeDetailTags,
  type TribeDetailDesktopTabId,
  type TribeDetailEventCard,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef } from "react";

type TribeDetailDesktopViewProps = {
  tribe: Tribe;
  city: string;
  slug: string;
  events: LocalEvent[];
  places: CulturalPlaceListItem[];
  members: TribeMember[];
  membersTotal: number;
  postsPreview: FeedPost[];
  isAuthenticated: boolean;
  joining: boolean;
  leaving: boolean;
  actionError: string | null;
  onJoin: (accepted: boolean) => Promise<void>;
  onLeave: () => Promise<void>;
  onShare: () => void;
};

export function TribeDetailDesktopView({
  tribe,
  city,
  events,
  places,
  members,
  postsPreview,
  isAuthenticated,
  joining,
  actionError,
  onJoin,
  onLeave,
  onShare,
}: TribeDetailDesktopViewProps) {
  const joinRailRef = useRef<HTMLDivElement>(null);
  const { activeId, scrollTo, scrollToAnchor } = useTribeDetailSectionScroll<TribeDetailDesktopTabId>(
    TRIBE_DETAIL_DESKTOP_TABS,
    "overview",
  );

  const showPrivateGate =
    tribe.visibility === "private_invite" && !tribe.viewer_is_member && !tribe.is_archived;
  const showActions = !tribe.is_archived && !showPrivateGate;
  const canSeeMembers = tribe.viewer_is_member && !tribe.is_archived;
  const canSeePosts = canSeeMembers;
  const showJoinWidget = showActions && !tribe.viewer_is_member && tribe.visibility === "public";

  const breadcrumbs = useMemo(() => buildTribeDetailBreadcrumbs(tribe), [tribe]);
  const tags = useMemo(() => buildTribeDetailTags(tribe), [tribe]);
  const locationMeta = useMemo(() => buildTribeDetailDesktopLocationMeta(tribe), [tribe]);
  const galleryUrls = useMemo(
    () => buildTribeDetailDesktopGalleryUrls(tribe, postsPreview),
    [postsPreview, tribe],
  );
  const eventCards = useMemo(
    () => buildTribeDetailEventCards({ tribe, events, culturalPlaces: places, maxItems: 6 }),
    [events, places, tribe],
  );
  const nextEvent: TribeDetailEventCard | null = eventCards[0] ?? null;
  const postCards = useMemo(() => buildTribeDetailPostCards(postsPreview, 4), [postsPreview]);
  const featuredCard = useMemo(
    () => buildTribeDetailDesktopFeaturedCard(tribe, postsPreview),
    [postsPreview, tribe],
  );
  const projectUrls = useMemo(() => buildTribeDetailDesktopProjectUrls(postsPreview), [postsPreview]);
  const joinBenefits = useMemo(() => buildTribeDetailDesktopJoinBenefits(), []);
  const rules = useMemo(() => buildTribeDetailDesktopEssentialRules(), []);

  const tribesHref = `/tribes?city=${encodeURIComponent(city)}`;

  function scrollToCharter() {
    scrollToAnchor("#tribe-about");
  }

  function scrollToJoinRail() {
    joinRailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      className="tribe-detail-desktop-shell web-desktop-tribe-detail-only mx-auto w-full max-w-[1200px] space-y-5 px-4 pb-12 lg:px-6"
      data-tribe-detail-desktop=""
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={tribesHref}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {TRIBE_DETAIL_DESKTOP_BACK}
        </Link>
        <TribeDetailBreadcrumbs items={breadcrumbs} />
      </div>

      {tribe.is_archived ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-8">
          <h2 className="font-semibold text-neutral-900">{TRIBE_ARCHIVED_TITLE}</h2>
          <p className="mt-2 text-sm text-neutral-600">{TRIBE_ARCHIVED_BODY}</p>
        </div>
      ) : null}

      {showPrivateGate ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-8">
          <h2 className="font-semibold text-neutral-900">{TRIBE_PRIVATE_TITLE}</h2>
          <p className="mt-2 text-sm text-neutral-600">{TRIBE_PRIVATE_BODY}</p>
          {isAuthenticated ? (
            <div className="mt-4">
              <TribeJoinRequestButton tribe={tribe} />
            </div>
          ) : null}
        </div>
      ) : null}

      {!showPrivateGate ? (
        <>
          <TribeDetailDesktopHero
            tribe={tribe}
            city={city}
            tags={tags}
            locationMeta={locationMeta}
            galleryUrls={galleryUrls}
            showActions={showActions}
            isAuthenticated={isAuthenticated}
            isMember={tribe.viewer_is_member}
            joining={joining}
            onJoinClick={scrollToJoinRail}
            onShare={onShare}
            onLeaveClick={() => void onLeave()}
          />

          <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
            <TribeDetailSectionNav
              tabs={TRIBE_DETAIL_DESKTOP_TABS}
              activeId={activeId}
              onSelect={scrollTo}
            />

            <div className="tribe-detail-desktop-grid gap-6 p-4 lg:p-5">
              <div className="min-w-0 space-y-6">
                <div id="tribe-overview" className="tribe-detail-section space-y-6">
                  {showJoinWidget ? (
                    <TribeDetailDesktopJoinBanner
                      onJoinClick={scrollToJoinRail}
                      onReadCharter={scrollToCharter}
                    />
                  ) : null}

                  <TribeDetailDesktopFeatured
                    card={featuredCard}
                    onShare={onShare}
                    onReadCharter={scrollToCharter}
                  />
                </div>

                <TribeDetailDesktopDiscussions posts={postCards} canSeePosts={canSeePosts} />

                <TribeDetailDesktopNextEvent event={nextEvent} />

                <TribeDetailDesktopProjectsGallery imageUrls={projectUrls} />

                {eventCards.length > 1 ? (
                  <TribeDetailEventsSection events={eventCards.slice(1)} />
                ) : null}

                {canSeeMembers ? (
                  <div id="tribe-members" className="tribe-detail-section">
                    <TribeMembersSection tribe={tribe} city={city} />
                  </div>
                ) : null}

                {canSeeMembers ? (
                  <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
                    <TribeWallSection tribe={tribe} city={city} />
                  </section>
                ) : null}

                <TribeJoinRequestsSection tribe={tribe} city={city} />
                <TribeEditForm tribe={tribe} city={city} />
                <TribeModerationPanel tribe={tribe} city={city} />
              </div>

              <div ref={joinRailRef} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
                <TribeDetailDesktopRightRail
                  tribe={tribe}
                  tags={tags}
                  locationMeta={locationMeta}
                  nextEvent={nextEvent}
                  joinBenefits={joinBenefits}
                  rules={rules}
                  showJoinWidget={showJoinWidget}
                  joining={joining}
                  actionError={actionError}
                  onJoin={onJoin}
                  onReadCharter={scrollToCharter}
                  onScrollAbout={scrollToCharter}
                />
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
