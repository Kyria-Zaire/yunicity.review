"use client";

import { TribeDetailMediumDiscussions } from "@/components/tribes/detail/medium/tribe-detail-medium-discussions";
import { TribeDetailMediumFeatured } from "@/components/tribes/detail/medium/tribe-detail-medium-featured";
import { TribeDetailMediumHeader } from "@/components/tribes/detail/medium/tribe-detail-medium-header";
import { TribeDetailMediumHero } from "@/components/tribes/detail/medium/tribe-detail-medium-hero";
import { TribeDetailMediumInfoGrid } from "@/components/tribes/detail/medium/tribe-detail-medium-info-grid";
import { TribeDetailMediumJoinBanner } from "@/components/tribes/detail/medium/tribe-detail-medium-join-banner";
import { TribeDetailMediumJoinCard } from "@/components/tribes/detail/medium/tribe-detail-medium-join-card";
import { TribeDetailMediumNextEvent } from "@/components/tribes/detail/medium/tribe-detail-medium-next-event";
import { TribeDetailMediumProjectsGallery } from "@/components/tribes/detail/medium/tribe-detail-medium-projects-gallery";
import { TribeDetailSectionNav } from "@/components/tribes/detail/shared";
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
  TRIBE_DETAIL_MEDIUM_TABS,
  TRIBE_PRIVATE_BODY,
  TRIBE_PRIVATE_TITLE,
  buildTribeDetailEventCards,
  buildTribeDetailMediumEssentialRules,
  buildTribeDetailMediumFeaturedCard,
  buildTribeDetailMediumGalleryUrls,
  buildTribeDetailMediumLocationMeta,
  buildTribeDetailMediumProjectUrls,
  buildTribeDetailPostCards,
  buildTribeDetailTags,
  type TribeDetailEventCard,
  type TribeDetailMediumTabId,
} from "@yunicity/utils";
import { useMemo, useRef } from "react";

type TribeDetailMediumViewProps = {
  tribe: Tribe;
  city: string;
  events: LocalEvent[];
  places: CulturalPlaceListItem[];
  members: TribeMember[];
  postsPreview: FeedPost[];
  isAuthenticated: boolean;
  joining: boolean;
  leaving: boolean;
  actionError: string | null;
  onJoin: (accepted: boolean) => Promise<void>;
  onLeave: () => Promise<void>;
  onShare: () => void;
};

export function TribeDetailMediumView({
  tribe,
  city,
  events,
  places,
  postsPreview,
  isAuthenticated,
  joining,
  actionError,
  onJoin,
  onLeave,
  onShare,
}: TribeDetailMediumViewProps) {
  const joinCardRef = useRef<HTMLDivElement>(null);
  const { activeId, scrollTo, scrollToAnchor } = useTribeDetailSectionScroll<TribeDetailMediumTabId>(
    TRIBE_DETAIL_MEDIUM_TABS,
    "overview",
  );

  const showPrivateGate =
    tribe.visibility === "private_invite" && !tribe.viewer_is_member && !tribe.is_archived;
  const showActions = !tribe.is_archived && !showPrivateGate;
  const canSeeMembers = tribe.viewer_is_member && !tribe.is_archived;
  const canSeePosts = canSeeMembers;
  const showJoinCard = showActions && !tribe.viewer_is_member && tribe.visibility === "public";

  const tags = useMemo(() => buildTribeDetailTags(tribe), [tribe]);
  const locationMeta = useMemo(() => buildTribeDetailMediumLocationMeta(tribe), [tribe]);
  const galleryUrls = useMemo(
    () => buildTribeDetailMediumGalleryUrls(tribe, postsPreview),
    [postsPreview, tribe],
  );
  const eventCards = useMemo(
    () => buildTribeDetailEventCards({ tribe, events, culturalPlaces: places, maxItems: 6 }),
    [events, places, tribe],
  );
  const nextEvent: TribeDetailEventCard | null = eventCards[0] ?? null;
  const postCards = useMemo(() => buildTribeDetailPostCards(postsPreview, 4), [postsPreview]);
  const featuredCard = useMemo(
    () => buildTribeDetailMediumFeaturedCard(tribe, postsPreview),
    [postsPreview, tribe],
  );
  const projectUrls = useMemo(() => buildTribeDetailMediumProjectUrls(postsPreview), [postsPreview]);
  const rules = useMemo(() => buildTribeDetailMediumEssentialRules(), []);

  const tribesHref = `/tribes?city=${encodeURIComponent(city)}`;

  function scrollToCharter() {
    scrollToAnchor("#tribe-medium-about");
  }

  function scrollToJoinCard() {
    joinCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      className="tribe-detail-medium-shell web-medium-tribe-detail-only mx-auto w-full max-w-[960px] space-y-5 px-4 py-3 pb-12 sm:px-6"
      data-tribe-detail-medium=""
    >
      <TribeDetailMediumHeader tribesHref={tribesHref} />

      {tribe.is_archived ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-6">
          <h2 className="font-semibold text-neutral-900">{TRIBE_ARCHIVED_TITLE}</h2>
          <p className="mt-2 text-sm text-neutral-600">{TRIBE_ARCHIVED_BODY}</p>
        </div>
      ) : null}

      {showPrivateGate ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-6">
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
          <TribeDetailMediumHero
            tribe={tribe}
            tags={tags}
            locationMeta={locationMeta}
            galleryUrls={galleryUrls}
            showActions={showActions}
            isMember={tribe.viewer_is_member}
            onShare={onShare}
            onLeaveClick={() => void onLeave()}
          />

          {showJoinCard ? (
            <div ref={joinCardRef}>
              <TribeDetailMediumJoinCard
                tribe={tribe}
                city={city}
                joining={joining}
                actionError={actionError}
                isAuthenticated={isAuthenticated}
                onJoin={onJoin}
                onReadCharter={scrollToCharter}
              />
            </div>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
            <TribeDetailSectionNav
              tabs={TRIBE_DETAIL_MEDIUM_TABS}
              activeId={activeId}
              onSelect={scrollTo}
            />

            <div className="space-y-5 p-4 sm:p-5">
              <div id="tribe-medium-overview" className="tribe-detail-section space-y-5">
                {showJoinCard ? (
                  <TribeDetailMediumJoinBanner
                    onJoinClick={scrollToJoinCard}
                    onReadCharter={scrollToCharter}
                  />
                ) : null}

                <TribeDetailMediumFeatured
                  card={featuredCard}
                  onShare={onShare}
                  onReadCharter={scrollToCharter}
                />
              </div>

              <TribeDetailMediumDiscussions posts={postCards} canSeePosts={canSeePosts} />

              <TribeDetailMediumNextEvent event={nextEvent} />

              <TribeDetailMediumInfoGrid
                tribe={tribe}
                tags={tags}
                locationMeta={locationMeta}
                rules={rules}
                onReadCharter={scrollToCharter}
                onScrollAbout={scrollToCharter}
              />

              <TribeDetailMediumProjectsGallery imageUrls={projectUrls} />

              {canSeeMembers ? (
                <div id="tribe-medium-members" className="tribe-detail-section">
                  <TribeMembersSection tribe={tribe} city={city} />
                </div>
              ) : null}

              {canSeeMembers ? (
                <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
                  <TribeWallSection tribe={tribe} city={city} />
                </section>
              ) : null}

              <TribeJoinRequestsSection tribe={tribe} city={city} />
              <TribeEditForm tribe={tribe} city={city} />
              <TribeModerationPanel tribe={tribe} city={city} />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
