"use client";

import type { FeedReportReason } from "@yunicity/types";
import type { FeedPortalView } from "@yunicity/utils";
import {
  FEED_MEDIUM_STORIES_TITLE,
  FEED_PORTAL_FOR_YOU_HINT,
  FEED_PORTAL_POPULAR_HINT,
  PROFILE_INTERESTS,
  buildFeedDesktopMoments,
  buildFeedHighlightEvents,
  buildFeedStoryShortcuts,
  filterFeedPostsByView,
  filterFeedPostsContributions,
  filterFeedPostsDiscussions,
} from "@yunicity/utils";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { FeedDesktopScreen } from "@/components/feed/desktop/feed-desktop-screen";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedEmptyState } from "@/components/feed/feed-empty-state";
import { FeedErrorState } from "@/components/feed/feed-error-state";
import { FeedLoadingState } from "@/components/feed/feed-loading-state";
import {
  FeedMobileComposer,
  FeedMobileHeader,
  FeedMobileStoriesRail,
} from "@/components/feed/mobile";
import { CitizenAuthenticatedShell } from "@/components/shell/citizen-authenticated-shell";
import { FeedMediumFilterSheet } from "@/components/feed/portal/feed-medium-filter-sheet";
import { FeedMediumHeader } from "@/components/feed/portal/feed-medium-header";
import { FeedSavedEventsPanel } from "@/components/feed/portal/feed-saved-events-panel";
import { FeedStoriesRail } from "@/components/feed/portal/feed-stories-rail";
import { FeedStreamList } from "@/components/feed/portal/feed-stream-list";
import { FeedViewTabs } from "@/components/feed/portal/feed-view-tabs";
import { useFeed } from "@/hooks/use-feed";
import { useFeedPortalContext } from "@/hooks/use-feed-portal-context";
import { useLocalVideoTeasers } from "@/hooks/use-local-video-teasers";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import type { FeedContextModuleFamily } from "@/lib/feed/feed-context-stream";
import {
  feedEnrichmentForScope,
  resolveFeedEnrichmentSnapshot,
} from "@/lib/feed/feed-enrichment-snapshot";
import {
  buildFeedStream,
  filterFeedContextFamiliesForDesktop,
} from "@/lib/feed/feed-stream";
import { FEED_MOBILE_CONTENT_PADDING_CLASS } from "@/lib/layout/feed-mobile-full-bleed";
import {
  isFeedMediumInterestFilterActive,
  resetFeedMediumFilterActivation,
} from "@/lib/layout/feed-medium-filter-contract";

type FeedLeftNav =
  | FeedPortalView
  | "home"
  | "for_you"
  | "favorites"
  | "my_events"
  | "my_tribes"
  | "discussions"
  | "stories"
  | "contributions"
  | "saved"
  | "subscriptions"
  | "nearby"
  | null;

export function FeedPortalScreen() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const portal = useFeedPortalContext();
  const composerRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<FeedPortalView>("for_you");
  const [leftNav, setLeftNav] = useState<FeedLeftNav>(null);
  const [interestFilterActive, setInterestFilterActive] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const feed = useFeed({
    scopeKey: `${activeView}:${leftNav ?? "main"}:${interestFilterActive}`,
  });

  const {
    loadInitial,
    refresh,
    loadMore,
    items,
    isLoading,
    error,
    appendError,
    hasNextPage,
    isLoadingMore,
    createPost,
    toggleLike,
  } = feed;

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const city = portal.city || user?.city || "Reims";
  const interests = useMemo(() => {
    const fromProfile = portal.profile?.interests ?? [];
    return fromProfile.filter((interest): interest is (typeof PROFILE_INTERESTS)[number] =>
      (PROFILE_INTERESTS as readonly string[]).includes(interest),
    );
  }, [portal.profile?.interests]);

  const videoTeasers = useLocalVideoTeasers({ city, filter: { kind: "city" } });
  const candidateStreamVideo = videoTeasers.items[0] ?? null;
  const stories = useMemo(
    () =>
      buildFeedStoryShortcuts({
        city,
        profile: portal.profile,
        tribes: portal.tribes,
        events: portal.events,
        culturalPlaces: portal.culturalPlaces,
        storyRings: portal.storyRings,
      }),
    [city, portal.culturalPlaces, portal.events, portal.profile, portal.storyRings, portal.tribes],
  );
  const desktopMoments = useMemo(
    () =>
      buildFeedDesktopMoments({
        city,
        culturalPlaces: portal.culturalPlaces,
        localVideos: videoTeasers.items,
      }),
    [city, portal.culturalPlaces, videoTeasers.items],
  );
  const highlights = useMemo(
    () =>
      buildFeedHighlightEvents({
        city,
        events: portal.events,
        culturalPlaces: portal.culturalPlaces,
      }),
    [city, portal.culturalPlaces, portal.events],
  );

  const displayedPosts = useMemo(() => {
    if (leftNav === "discussions") return filterFeedPostsDiscussions(items);
    if (leftNav === "contributions") return filterFeedPostsContributions(items, user?.id ?? null);
    if (leftNav === "saved") return [];

    const interestFilter =
      activeView === "for_you" &&
      isFeedMediumInterestFilterActive({ activated: interestFilterActive, interests })
        ? interests
        : [];
    return filterFeedPostsByView(items, activeView, {
      interests: interestFilter,
      userId: user?.id ?? null,
    });
  }, [activeView, interestFilterActive, interests, items, leftNav, user?.id]);

  const streamIsContextual = activeView === "for_you" && leftNav === null;
  const candidateContextFamilies = useMemo<FeedContextModuleFamily[]>(() => {
    const families: FeedContextModuleFamily[] = [];
    if (highlights.length > 0) families.push("must-see");
    if (portal.highlightOffer) families.push("local-privilege");
    return families;
  }, [highlights.length, portal.highlightOffer]);

  const enrichmentCandidate = useMemo(
    () => ({
      scopeKey: city,
      value: {
        video: candidateStreamVideo,
        families: candidateContextFamilies,
        highlights,
        highlightOffer: portal.highlightOffer,
        tribes: [],
        trends: [],
      },
    }),
    [
      candidateContextFamilies,
      candidateStreamVideo,
      city,
      highlights,
      portal.highlightOffer,
    ],
  );
  const [enrichmentSnapshot, setEnrichmentSnapshot] = useState<
    typeof enrichmentCandidate | null
  >(null);
  const enrichmentSourcesSettled = !portal.loading && !videoTeasers.isLoading;

  useEffect(() => {
    setEnrichmentSnapshot((current) =>
      resolveFeedEnrichmentSnapshot(current, enrichmentCandidate, enrichmentSourcesSettled),
    );
  }, [enrichmentCandidate, enrichmentSourcesSettled]);

  const resolvedEnrichment = feedEnrichmentForScope(enrichmentSnapshot, city);
  const renderedEnrichment = streamIsContextual ? resolvedEnrichment : enrichmentCandidate.value;
  const streamWaitingForEnrichment = streamIsContextual && resolvedEnrichment === null;

  const stream = useMemo(
    () =>
      buildFeedStream(displayedPosts, streamIsContextual ? renderedEnrichment?.video ?? null : null, activeView, {
        availableContextFamilies: streamIsContextual ? renderedEnrichment?.families ?? [] : [],
      }),
    [activeView, displayedPosts, renderedEnrichment, streamIsContextual],
  );
  const desktopStream = useMemo(
    () =>
      buildFeedStream(displayedPosts, streamIsContextual ? renderedEnrichment?.video ?? null : null, activeView, {
        availableContextFamilies: streamIsContextual
          ? filterFeedContextFamiliesForDesktop(renderedEnrichment?.families ?? [])
          : [],
      }),
    [activeView, displayedPosts, renderedEnrichment, streamIsContextual],
  );
  const streamLoading = isLoading || (!error && streamWaitingForEnrichment);

  const viewHint =
    activeView === "for_you" &&
    !leftNav &&
    isFeedMediumInterestFilterActive({ activated: interestFilterActive, interests })
      ? FEED_PORTAL_FOR_YOU_HINT
      : activeView === "popular" && !leftNav
        ? FEED_PORTAL_POPULAR_HINT
        : null;
  const filterHint = isFeedMediumInterestFilterActive({ activated: interestFilterActive, interests }) ? (
    <>
      Filtre actif selon vos centres d&apos;intérêt : {interests.slice(0, 4).join(", ")}
      {interests.length > 4 ? "..." : ""}
    </>
  ) : interestFilterActive && interests.length === 0 ? (
    <>
      Ajoutez vos centres d&apos;intérêt dans les{" "}
      <Link href="/settings" className="font-semibold text-yunicity-primary hover:underline">
        paramètres
      </Link>{" "}
      pour activer le filtrage.
    </>
  ) : null;

  function openMediumFilter(trigger: HTMLButtonElement) {
    filterTriggerRef.current = trigger;
    if (filterPanelOpen) {
      setFilterPanelOpen(false);
      return;
    }
    setInterestFilterActive(true);
    setFilterPanelOpen(true);
  }

  function resetInterestFilter() {
    setInterestFilterActive(resetFeedMediumFilterActivation());
    setFilterPanelOpen(false);
  }

  async function handleCreate(body: string, mediaUrl?: string | null) {
    await createPost(body, mediaUrl);
  }

  async function handleReport(postId: string, reason: FeedReportReason) {
    await api.reportFeedPost(postId, { reason });
    setReportMessage("Merci, votre signalement a été transmis à l'équipe.");
    setTimeout(() => setReportMessage(null), 4000);
  }

  function handleLeftNavSelect(nav: FeedLeftNav) {
    if (nav === "for_you" || nav === "recent" || nav === "popular") {
      setActiveView(nav);
      setLeftNav(null);
      return;
    }
    setLeftNav(nav);
  }

  const userFirstName = user?.full_name?.split(" ")[0] || "Voyageur";
  const filterActive = isFeedMediumInterestFilterActive({
    activated: interestFilterActive,
    interests,
  });

  return (
    <CitizenAuthenticatedShell variant="citizen-feed-shell">
      <>
        <div className="feed-desktop-view">
          <FeedDesktopScreen
            city={city}
            userFirstName={userFirstName}
            userAvatarUrl={portal.profile?.avatar_url ?? null}
            activeView={activeView}
            leftNav={leftNav}
            onViewChange={(view) => {
              setLeftNav(null);
              setActiveView(view);
            }}
            onLeftNavSelect={handleLeftNavSelect}
            storyMoments={desktopMoments}
            stream={desktopStream}
            streamLoading={streamLoading}
            streamError={error}
            highlights={renderedEnrichment?.highlights ?? []}
            highlightOffer={renderedEnrichment?.highlightOffer ?? null}
            trends={[]}
            portalEvents={portal.events}
            savedEvents={portal.savedEvents}
            onCreatePost={handleCreate}
            onToggleLike={toggleLike}
            onReport={handleReport}
            onRefresh={() => void refresh()}
            hasNextPage={hasNextPage}
            isLoadingMore={isLoadingMore}
            appendError={appendError}
            onLoadMore={loadMore}
            filterPanelOpen={filterPanelOpen}
            filterActive={filterActive}
            onOpenFilter={openMediumFilter}
            filterHint={filterHint}
          />
        </div>

        <div className="feed-medium-mobile-view">
          <div className="feed-medium-column feed-medium-editorial-grid min-w-0 flex-1">
            <div className="web-mobile-feed-only min-w-0 pt-1">
              <FeedMobileHeader />
              <div className={`mt-4 space-y-4 ${FEED_MOBILE_CONTENT_PADDING_CLASS}`}>
                <FeedMobileComposer city={city} onSubmit={handleCreate} />
                <FeedMobileStoriesRail
                  profile={portal.profile}
                  storyRings={portal.storyRings}
                  storyShortcuts={stories}
                />
                {interestFilterActive ? (
                  <p className="rounded-xl bg-white px-3 py-2.5 text-xs text-neutral-500 ring-1 ring-neutral-200/90">
                    {filterHint}
                  </p>
                ) : null}
              </div>
            </div>

            <FeedMediumHeader
              city={city}
              filterPanelOpen={filterPanelOpen}
              filterActive={filterActive}
              onOpenFilter={openMediumFilter}
              filterButtonRef={filterTriggerRef}
            />

            <div
              data-feed-medium-region="stories"
              data-feed-medium-surface="primary"
              className="web-desktop-feed-only overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
            >
              <div className="border-b border-neutral-100 px-4 py-5 sm:px-6">
                <h2
                  data-feed-medium-stories-title=""
                  className="feed-medium-stories-title text-sm font-bold text-neutral-900"
                >
                  {FEED_MEDIUM_STORIES_TITLE}
                </h2>
                <FeedStoriesRail items={stories} seeAllHref="/stories" />
              </div>
              <div className="px-4 sm:px-6 feed-view-tabs-shell">
                <FeedViewTabs
                  activeView={activeView}
                  onViewChange={(view) => {
                    setLeftNav(null);
                    setActiveView(view);
                    setFilterPanelOpen(false);
                  }}
                  filterOpen={interestFilterActive}
                  onToggleFilter={() => setInterestFilterActive((value) => !value)}
                />
              </div>
              {interestFilterActive && filterHint ? (
                <p className="feed-legacy-filter-banner border-b border-neutral-100 px-4 py-3 text-xs text-neutral-500 sm:px-6">
                  {filterHint}
                </p>
              ) : null}
            </div>

            <div
              id="feed-composer"
              ref={composerRef}
              data-feed-medium-region="composer"
              className="web-desktop-feed-only mt-5 scroll-mt-28"
            >
              <div
                data-feed-medium-surface="primary"
                className="rounded-2xl border border-neutral-200/90 bg-white px-4 shadow-sm sm:px-5"
              >
                <FeedComposer city={city} onSubmit={handleCreate} />
              </div>
            </div>

            <div data-feed-medium-region="stream" className="feed-stream-region">
              {viewHint ? (
                <p className="feed-stream-hint text-xs leading-relaxed text-neutral-500">{viewHint}</p>
              ) : null}
              {reportMessage ? (
                <p className="feed-stream-notice rounded-xl bg-yunicity-primary-soft px-4 py-3 text-sm text-yunicity-primary">
                  {reportMessage}
                </p>
              ) : null}
              {streamLoading ? <FeedLoadingState /> : null}
              {!streamLoading && error ? <FeedErrorState onRetry={() => void refresh()} /> : null}
              {!streamLoading && !error && leftNav === "saved" ? (
                <FeedSavedEventsPanel events={portal.savedEvents} city={city} />
              ) : null}
              {!streamLoading && !error && leftNav !== "saved" && stream.length === 0 ? (
                interestFilterActive && items.length > 0 ? (
                  <div
                    data-feed-medium-surface="primary"
                    className="rounded-2xl border border-dashed border-yunicity-border bg-white p-8 text-center shadow-sm"
                  >
                    <p className="text-base font-semibold text-neutral-900">
                      Aucune publication ne correspond à vos centres d&apos;intérêt
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
                      Désactivez le filtre ou ajustez vos préférences pour voir plus de contenu local.
                    </p>
                    <button
                      type="button"
                      onClick={() => setInterestFilterActive(false)}
                      className="mt-4 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Désactiver le filtre
                    </button>
                  </div>
                ) : (
                  <FeedEmptyState city={city} highlights={renderedEnrichment?.highlights ?? []} />
                )
              ) : null}
              {!streamLoading && !error && leftNav !== "saved" && stream.length > 0 ? (
                <FeedStreamList
                  stream={stream}
                  city={city}
                  highlights={renderedEnrichment?.highlights ?? []}
                  highlightOffer={renderedEnrichment?.highlightOffer ?? null}
                  tribes={[]}
                  trends={[]}
                  onToggleLike={toggleLike}
                  onReport={handleReport}
                  hasNextPage={hasNextPage}
                  isLoadingMore={isLoadingMore}
                  appendError={appendError}
                  onLoadMore={loadMore}
                />
              ) : null}
            </div>
          </div>
        </div>

        <FeedMediumFilterSheet
          open={filterPanelOpen}
          onOpenChange={setFilterPanelOpen}
          activated={interestFilterActive}
          interests={interests}
          onReset={resetInterestFilter}
          returnFocusRef={filterTriggerRef}
        />
      </>
    </CitizenAuthenticatedShell>
  );
}
