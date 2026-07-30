"use client";

import { TribesAppShell } from "@/components/tribes/tribes-app-shell";
import { TribeDetailMobileView } from "@/components/tribes/mobile";
import { TribeDetailAboutGrid } from "@/components/tribes/tribe-detail-about-grid";
import { TribeDetailBreadcrumbs } from "@/components/tribes/tribe-detail-breadcrumbs";
import { TribeDetailEventsSection } from "@/components/tribes/tribe-detail-events-section";
import { TribeDetailInternalSidebar } from "@/components/tribes/tribe-detail-internal-sidebar";
import { TribeDetailPortalHero } from "@/components/tribes/tribe-detail-portal-hero";
import { TribeDetailPostsRail } from "@/components/tribes/tribe-detail-posts-rail";
import { TribeDetailTabs } from "@/components/tribes/tribe-detail-tabs";
import { TribeMembersSection } from "@/components/tribes/tribe-members-section";
import { TribeEditForm } from "@/components/tribes/tribe-edit-form";
import { TribeModerationPanel } from "@/components/tribes/tribe-moderation-panel";
import { TribeWallSection } from "@/components/tribes/tribe-wall-section";
import { useTribeDetail } from "@/hooks/use-tribe-detail";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  TRIBE_ARCHIVED_BODY,
  TRIBE_ARCHIVED_TITLE,
  TRIBE_DETAIL_LOADING,
  TRIBE_NOT_FOUND,
  TRIBE_PRIVATE_BODY,
  TRIBE_PRIVATE_TITLE,
  TRIBES_RETRY,
  TRIBE_DETAIL_TABS,
  buildTribeDetailAboutFacts,
  buildTribeDetailBreadcrumbs,
  buildTribeDetailEventCards,
  buildTribeDetailHeroMeta,
  buildTribeDetailMemberPreviews,
  buildTribeDetailPostCards,
  buildTribeDetailQuickStats,
  buildTribeDetailSidebarTribes,
  buildTribeDetailTags,
  buildTribeShareText,
  countTribeUpcomingEvents,
} from "@yunicity/utils";
import { useMemo } from "react";

export function TribeDetailScreen({ slug, city }: { slug: string; city: string }) {
  const { isAuthenticated, user } = useAuth();
  const {
    tribe,
    loading,
    error,
    events,
    places,
    members,
    membersTotal,
    memberTribes,
    postsPreview,
    actionError,
    joining,
    leaving,
    reload,
    join,
    leave,
  } = useTribeDetail(slug, city);

  const breadcrumbs = useMemo(
    () => (tribe ? buildTribeDetailBreadcrumbs(tribe) : []),
    [tribe],
  );

  const sidebarTribes = useMemo(
    () =>
      buildTribeDetailSidebarTribes({
        city,
        tribes: memberTribes,
        activeSlug: slug,
      }),
    [city, memberTribes, slug],
  );

  if (loading) {
    return (
      <TribesAppShell>
        <p className="px-3 py-12 text-center text-sm text-neutral-500">{TRIBE_DETAIL_LOADING}</p>
      </TribesAppShell>
    );
  }

  if (error || !tribe) {
    return (
      <TribesAppShell>
        <div className="mx-auto max-w-lg px-3 py-12 text-center">
          <p className="text-sm text-neutral-700">{error ?? TRIBE_NOT_FOUND}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-4 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {TRIBES_RETRY}
          </button>
        </div>
      </TribesAppShell>
    );
  }

  const showPrivateGate =
    tribe.visibility === "private_invite" && !tribe.viewer_is_member && !tribe.is_archived;
  const showActions = !tribe.is_archived && !showPrivateGate;
  const canSeeMembers = tribe.viewer_is_member && !tribe.is_archived;
  const canSeePosts = canSeeMembers;

  const heroMeta = buildTribeDetailHeroMeta(tribe);
  const tags = buildTribeDetailTags(tribe);
  const eventsCount = countTribeUpcomingEvents(tribe, events);
  const stats = buildTribeDetailQuickStats({
    tribe,
    eventsCount,
    postsCount: canSeePosts ? postsPreview.length : null,
  });
  const facts = buildTribeDetailAboutFacts(tribe);
  const eventCards = buildTribeDetailEventCards({
    tribe,
    events,
    culturalPlaces: places,
  });
  const memberPreviews = buildTribeDetailMemberPreviews(members, {
    currentUserId: user?.id ?? null,
  });
  const postCards = buildTribeDetailPostCards(postsPreview);
  const eventsHref = `/events?city=${encodeURIComponent(city)}`;
  const currentTribe = tribe;

  async function shareTribe() {
    const text = buildTribeShareText(currentTribe);
    const url = `${window.location.origin}/tribes/${encodeURIComponent(currentTribe.slug)}?city=${encodeURIComponent(city)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: currentTribe.name, text, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <TribesAppShell>
      <TribeDetailMobileView
        tribe={currentTribe}
        city={city}
        slug={slug}
        events={events}
        places={places}
        members={members}
        membersTotal={membersTotal}
        postsPreview={postsPreview}
        isAuthenticated={isAuthenticated}
        currentUserId={user?.id ?? null}
        joining={joining}
        leaving={leaving}
        actionError={actionError}
        onJoin={async (accepted) => {
          await join(accepted);
        }}
        onLeave={leave}
        onShare={() => void shareTribe()}
      />

      <div className="web-desktop-tribe-detail-only mx-auto w-full max-w-[1400px] px-3 pb-12 sm:px-4 lg:px-6">
        <div className="grid gap-8 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-10">
          <TribeDetailInternalSidebar memberTribes={sidebarTribes} city={city} />

          <div className="min-w-0 space-y-6">
            <TribeDetailBreadcrumbs items={breadcrumbs} />

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
              </div>
            ) : null}

            <TribeDetailPortalHero
              tribe={currentTribe}
              heroMeta={heroMeta}
              tags={tags}
              stats={stats}
              showActions={showActions}
              joining={joining}
              leaving={leaving}
              actionError={actionError}
              isAuthenticated={isAuthenticated}
              onJoin={async (accepted) => {
                await join(accepted);
              }}
              onLeave={leave}
              onShare={() => void shareTribe()}
            />

            {!showPrivateGate ? (
              <>
                <TribeDetailTabs tabs={TRIBE_DETAIL_TABS} onShare={() => void shareTribe()} />

                <TribeDetailAboutGrid
                  description={currentTribe.description}
                  facts={facts}
                  events={eventCards}
                  members={memberPreviews}
                  posts={postCards}
                  membersTotal={membersTotal}
                  canSeeMembers={canSeeMembers}
                  canSeePosts={canSeePosts}
                  eventsHref={eventsHref}
                />

                <TribeDetailEventsSection events={eventCards} />
                <TribeDetailPostsRail posts={postCards} canSeePosts={canSeePosts} />

                {canSeeMembers ? (
                  <div id="tribe-members" className="scroll-mt-28">
                    <TribeMembersSection tribe={currentTribe} city={city} />
                  </div>
                ) : null}

                {canSeeMembers ? (
                  <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
                    <TribeWallSection tribe={currentTribe} city={city} />
                  </section>
                ) : null}

                <TribeEditForm tribe={currentTribe} city={city} />
                <TribeModerationPanel tribe={currentTribe} city={city} />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </TribesAppShell>
  );
}
