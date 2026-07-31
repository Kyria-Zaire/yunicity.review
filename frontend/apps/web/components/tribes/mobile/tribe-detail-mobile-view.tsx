"use client";

import {
  TribeDetailMobileHeader,
  TribeDetailMobileHero,
  TribeDetailMobileMembershipAction,
  TribeDetailMobileStatsGrid,
  TribeDetailMobileTabs,
} from "@/components/tribes/mobile";
import { TerritoryMobilePostComposer } from "@/components/shared/mobile";
import { TribeJoinRequestButton } from "@/components/tribes/tribe-join-request-button";
import { useTribeWall } from "@/hooks/use-tribe-wall";
import type { FeedPost, Tribe, TribeMember } from "@yunicity/types";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  TRIBE_ARCHIVED_BODY,
  TRIBE_ARCHIVED_TITLE,
  TRIBE_PRIVATE_BODY,
  TRIBE_PRIVATE_TITLE,
  buildTribeDetailAboutFacts,
  buildTribeDetailEventCards,
  buildTribeDetailMemberPreviews,
  buildTribeDetailMobileStats,
  countTribeUpcomingEvents,
} from "@yunicity/utils";
import { useEffect, useMemo } from "react";

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
  slug,
  events,
  places,
  members,
  membersTotal,
  postsPreview,
  isAuthenticated,
  currentUserId,
  joining,
  leaving,
  actionError,
  onJoin,
  onLeave,
  onShare,
}: TribeDetailMobileViewProps) {
  const showPrivateGate =
    tribe.visibility === "private_invite" && !tribe.viewer_is_member && !tribe.is_archived;
  const showActions = !tribe.is_archived && !showPrivateGate;
  const canSeeMembers = tribe.viewer_is_member && !tribe.is_archived;
  const canSeePosts = canSeeMembers;

  const wall = useTribeWall(slug, city, canSeePosts);

  useEffect(() => {
    if (canSeePosts) {
      void wall.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh on membership/city only
  }, [canSeePosts, slug, city]);

  const eventsCount = countTribeUpcomingEvents(tribe, events);
  const statsItems = useMemo(
    () =>
      buildTribeDetailMobileStats({
        tribe,
        eventsCount,
        postsCount: canSeePosts ? (wall.items.length || postsPreview.length) : null,
      }),
    [canSeePosts, eventsCount, postsPreview.length, tribe, wall.items.length],
  );

  const eventCards = useMemo(
    () =>
      buildTribeDetailEventCards({
        tribe,
        events,
        culturalPlaces: places,
        maxItems: 6,
      }),
    [events, places, tribe],
  );

  const memberPreviews = useMemo(
    () =>
      buildTribeDetailMemberPreviews(members, {
        currentUserId,
        maxItems: 8,
      }),
    [currentUserId, members],
  );

  const facts = useMemo(() => buildTribeDetailAboutFacts(tribe), [tribe]);

  const posts = wall.items.length > 0 ? wall.items : postsPreview;

  return (
    <div className="web-mobile-tribe-detail-only min-w-0 bg-white pb-6">
      <TribeDetailMobileHeader city={city} onShare={onShare} />

      <div className="space-y-4 px-4 py-3">
        {tribe.is_archived ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6">
            <h2 className="font-semibold text-neutral-900">{TRIBE_ARCHIVED_TITLE}</h2>
            <p className="mt-2 text-sm text-neutral-600">{TRIBE_ARCHIVED_BODY}</p>
          </div>
        ) : null}

        {showPrivateGate ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6">
            <h2 className="font-semibold text-neutral-900">{TRIBE_PRIVATE_TITLE}</h2>
            <p className="mt-2 text-sm text-neutral-600">{TRIBE_PRIVATE_BODY}</p>
            {isAuthenticated ? (
              <div className="mt-4">
                <TribeJoinRequestButton tribe={tribe} />
              </div>
            ) : null}
          </div>
        ) : null}

        <TribeDetailMobileHero
          tribe={tribe}
          members={members}
          membershipAction={
            showActions ? (
              <TribeDetailMobileMembershipAction
                tribe={tribe}
                isAuthenticated={isAuthenticated}
                joining={joining}
                leaving={leaving}
                actionError={actionError}
                onJoin={onJoin}
                onLeave={onLeave}
              />
            ) : null
          }
        />

        {!showPrivateGate ? (
          <>
            <TribeDetailMobileStatsGrid items={statsItems} />

            {canSeePosts ? (
              <TerritoryMobilePostComposer
                onSubmit={async (body, mediaUrl) => {
                  await wall.createPost(body, mediaUrl);
                }}
              />
            ) : null}

            <TribeDetailMobileTabs
              tribe={tribe}
              city={city}
              events={eventCards}
              members={memberPreviews}
              membersTotal={membersTotal}
              facts={facts}
              canSeeMembers={canSeeMembers}
              canSeePosts={canSeePosts}
              posts={posts}
              postsLoading={wall.loading}
              onToggleLike={(post) => void wall.toggleLike(post)}
              onLoadMorePosts={wall.loadMore}
              hasMorePosts={Boolean(wall.nextCursor)}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
