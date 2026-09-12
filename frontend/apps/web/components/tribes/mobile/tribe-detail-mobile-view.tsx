"use client";

import { TribeDetailSectionNav } from "@/components/tribes/detail/shared";
import {
  TribeDetailMobileAboutPanel,
  TribeDetailMobileDiscussionsSection,
  TribeDetailMobileHeader,
  TribeDetailMobileHero,
  TribeDetailMobileJoinCard,
  TribeDetailMobileNextEventSection,
  TribeDetailMobileUtilityLinks,
  TribeDetailMobileVisitorBanner,
  TribeDetailMobileWelcomeCard,
} from "@/components/tribes/mobile";
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
  TRIBE_DETAIL_MOBILE_TABS,
  TRIBE_PRIVATE_BODY,
  TRIBE_PRIVATE_TITLE,
  buildTribeDetailEventCards,
  buildTribeDetailMobileEssentialRules,
  buildTribeDetailMobileFeaturedCard,
  buildTribeDetailMobileLocationMeta,
  buildTribeDetailMobileProjectUrls,
  buildTribeDetailPostCards,
  buildTribeDetailTags,
  type TribeDetailEventCard,
  type TribeDetailMobileTabId,
} from "@yunicity/utils";
import { useMemo, useRef } from "react";

type TribeDetailMobileViewProps = {
  tribe: Tribe;
  city: string;
  slug: string;
  events: LocalEvent[];
  places: CulturalPlaceListItem[];
  members: TribeMember[];
  membersTotal: number;
  postsPreview: FeedPost[];
  isAuthenticated: boolean;
  currentUserId: string | null;
  joining: boolean;
  leaving: boolean;
  actionError: string | null;
  onJoin: (accepted: boolean) => Promise<void>;
  onLeave: () => Promise<void>;
  onShare: () => void;
};

/** Vue mobile complète détail tribu (MOBILE-TRIBE-DETAIL-01). */
export function TribeDetailMobileView({
  tribe,
  city,
  events,
  places,
  postsPreview,
  isAuthenticated,
  joining,
  actionError,
  onJoin,
  onShare,
}: TribeDetailMobileViewProps) {
  const joinCardRef = useRef<HTMLDivElement>(null);
  const { activeId, scrollTo, scrollToAnchor } = useTribeDetailSectionScroll<TribeDetailMobileTabId>(
    TRIBE_DETAIL_MOBILE_TABS,
    "overview",
  );

  const showPrivateGate =
    tribe.visibility === "private_invite" && !tribe.viewer_is_member && !tribe.is_archived;
  const showActions = !tribe.is_archived && !showPrivateGate;
  const canSeeMembers = tribe.viewer_is_member && !tribe.is_archived;
  const canSeePosts = canSeeMembers;
  const showJoinCard = showActions && !tribe.viewer_is_member && tribe.visibility === "public";
  const showVisitorBanner = showJoinCard;

  const tags = useMemo(() => buildTribeDetailTags(tribe), [tribe]);
  const locationMeta = useMemo(() => buildTribeDetailMobileLocationMeta(tribe), [tribe]);
  const eventCards = useMemo(
    () => buildTribeDetailEventCards({ tribe, events, culturalPlaces: places, maxItems: 6 }),
    [events, places, tribe],
  );
  const nextEvent: TribeDetailEventCard | null = eventCards[0] ?? null;
  const postCards = useMemo(() => buildTribeDetailPostCards(postsPreview, 4), [postsPreview]);
  const featuredCard = useMemo(
    () => buildTribeDetailMobileFeaturedCard(tribe, postsPreview),
    [postsPreview, tribe],
  );
  const projectUrls = useMemo(() => buildTribeDetailMobileProjectUrls(postsPreview), [postsPreview]);
  const rules = useMemo(() => buildTribeDetailMobileEssentialRules(), []);

  function scrollToCharter() {
    scrollToAnchor("#tribe-mobile-about-rules");
  }

  return (
    <div
      className="tribe-detail-mobile-shell web-mobile-tribe-detail-only min-w-0 bg-neutral-50 pb-12"
      data-tribe-detail-mobile=""
    >
      <TribeDetailMobileHeader tribeName={tribe.name} city={city} onShare={onShare} />

      <div className="space-y-4 px-4 py-3">
        {tribe.is_archived ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6">
            <h2 className="font-semibold text-neutral-900">{TRIBE_ARCHIVED_TITLE}</h2>
            <p className="mt-2 text-sm text-neutral-600">{TRIBE_ARCHIVED_BODY}</p>
          </div>
        ) : null}

        {showPrivateGate ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6">
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
            <TribeDetailMobileHero tribe={tribe} tags={tags} locationMeta={locationMeta} />

            {showJoinCard ? (
              <div ref={joinCardRef}>
                <TribeDetailMobileJoinCard
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
                tabs={TRIBE_DETAIL_MOBILE_TABS}
                activeId={activeId}
                onSelect={scrollTo}
              />

              <div className="space-y-5 bg-neutral-50 p-4">
                <div id="tribe-mobile-overview" className="tribe-detail-section space-y-5">
                  {showVisitorBanner ? <TribeDetailMobileVisitorBanner /> : null}

                  <TribeDetailMobileWelcomeCard card={featuredCard} onReadCharter={scrollToCharter} />
                </div>

                <TribeDetailMobileDiscussionsSection posts={postCards} canSeePosts={canSeePosts} />

                <TribeDetailMobileNextEventSection event={nextEvent} />

                <TribeDetailMobileUtilityLinks
                  onScrollProjects={() => scrollToAnchor("#tribe-mobile-projects")}
                  onScrollAbout={() => scrollToAnchor("#tribe-mobile-about")}
                  onScrollRules={() => scrollToAnchor("#tribe-mobile-about-rules")}
                  onScrollModeration={() => scrollToAnchor("#tribe-mobile-about-moderation")}
                />

                {canSeeMembers ? (
                  <div id="tribe-mobile-members" className="tribe-detail-section">
                    <TribeMembersSection tribe={tribe} city={city} />
                  </div>
                ) : null}

                {canSeeMembers ? (
                  <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
                    <TribeWallSection tribe={tribe} city={city} />
                  </section>
                ) : null}

                <TribeDetailMobileAboutPanel
                  tribe={tribe}
                  tags={tags}
                  locationMeta={locationMeta}
                  rules={rules}
                  projectUrls={projectUrls}
                  onReadCharter={scrollToCharter}
                />

                <TribeJoinRequestsSection tribe={tribe} city={city} />
                <TribeEditForm tribe={tribe} city={city} />
                <TribeModerationPanel tribe={tribe} city={city} />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
