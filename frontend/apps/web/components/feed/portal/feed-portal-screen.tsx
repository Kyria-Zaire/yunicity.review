"use client";

import type { FeedReportReason } from "@yunicity/types";
import type { FeedPortalView } from "@yunicity/utils";
import {
  FEED_LOAD_MORE_LABEL,
  FEED_PORTAL_FOR_YOU_HINT,
  FEED_PORTAL_POPULAR_HINT,
  PROFILE_INTERESTS,
  buildFeedHighlightEvents,
  buildFeedStoryShortcuts,
  buildFeedTrendItems,
  buildFeedTribeActivityItems,
  filterFeedPostsByView,
  filterFeedPostsContributions,
  filterFeedPostsDiscussions,
} from "@yunicity/utils";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { FeedCard } from "@/components/feed/feed-card";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedEmptyState } from "@/components/feed/feed-empty-state";
import { FeedErrorState } from "@/components/feed/feed-error-state";
import { FeedLoadingState } from "@/components/feed/feed-loading-state";
import { FeedAppShell } from "@/components/feed/portal/feed-app-shell";
import { FeedLeftRail } from "@/components/feed/portal/feed-left-rail";
import { FeedRightRail } from "@/components/feed/portal/feed-right-rail";
import { FeedSavedEventsPanel } from "@/components/feed/portal/feed-saved-events-panel";
import { FeedStoriesRail } from "@/components/feed/portal/feed-stories-rail";
import { FeedViewTabs } from "@/components/feed/portal/feed-view-tabs";
import {
  FeedMobileComposer,
  FeedMobileHeader,
  FeedMobileStoriesRail,
  FeedMobileViewPills,
} from "@/components/feed/mobile";
import { LocalVideoTeaserSection } from "@/components/videos/local-video-teaser-section";
import { useFeed } from "@/hooks/use-feed";
import { useFeedPortalContext } from "@/hooks/use-feed-portal-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

type FeedLeftNav =
  | FeedPortalView
  | "home"
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
  const feed = useFeed();
  const composerRef = useRef<HTMLDivElement>(null);

  const [activeView, setActiveView] = useState<FeedPortalView>("for_you");
  const [leftNav, setLeftNav] = useState<FeedLeftNav>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);

  const {
    loadInitial,
    refresh,
    loadMore,
    items,
    isLoading,
    error,
    nextCursor,
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
    return fromProfile.filter((i): i is (typeof PROFILE_INTERESTS)[number] =>
      (PROFILE_INTERESTS as readonly string[]).includes(i),
    );
  }, [portal.profile?.interests]);

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

  const tribeActivity = useMemo(
    () =>
      buildFeedTribeActivityItems({
        city,
        tribes: portal.tribes,
        events: portal.events,
      }),
    [city, portal.events, portal.tribes],
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

  const trends = useMemo(
    () =>
      buildFeedTrendItems({
        city,
        events: portal.events,
        culturalPlaces: portal.culturalPlaces,
        neighborhoods: portal.neighborhoods,
        tribes: portal.tribes,
      }),
    [city, portal.culturalPlaces, portal.events, portal.neighborhoods, portal.tribes],
  );

  const displayedPosts = useMemo(() => {
    if (leftNav === "discussions") return filterFeedPostsDiscussions(items);
    if (leftNav === "contributions") {
      return filterFeedPostsContributions(items, user?.id ?? null);
    }
    if (leftNav === "saved") return [];
    const interestFilter =
      activeView === "for_you" && filterOpen && interests.length > 0 ? interests : [];
    return filterFeedPostsByView(items, activeView, {
      interests: interestFilter,
      userId: user?.id ?? null,
    });
  }, [activeView, filterOpen, interests, items, leftNav, user?.id]);

  const viewHint =
    activeView === "for_you" && !leftNav && filterOpen
      ? FEED_PORTAL_FOR_YOU_HINT
      : activeView === "popular" && !leftNav
        ? FEED_PORTAL_POPULAR_HINT
        : null;

  const rightRail = (
    <FeedRightRail
      city={city}
      tribes={tribeActivity}
      highlights={highlights}
      trends={trends}
      highlightOffer={portal.highlightOffer}
      loading={portal.loading}
    />
  );

  async function handleCreate(body: string, mediaUrl?: string | null) {
    await createPost(body, mediaUrl);
  }

  async function handleReport(postId: string, reason: FeedReportReason) {
    await api.reportFeedPost(postId, { reason });
    setReportMessage("Merci — votre signalement a été transmis à l'équipe.");
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

  const filterHint =
    filterOpen && interests.length > 0 ? (
      <>
        Filtre actif selon vos centres d&apos;intérêt : {interests.slice(0, 4).join(", ")}
        {interests.length > 4 ? "…" : ""}
      </>
    ) : (
      <>
        Ajoutez vos centres d&apos;intérêt dans les{" "}
        <Link href="/settings" className="font-semibold text-yunicity-primary hover:underline">
          paramètres
        </Link>{" "}
        pour activer le filtrage.
      </>
    );

  const feedStates = (
    <>
      {viewHint ? (
        <p className="text-xs leading-relaxed text-neutral-500">{viewHint}</p>
      ) : null}

      {reportMessage ? (
        <p className="rounded-xl bg-yunicity-primary-soft px-4 py-3 text-sm text-yunicity-primary">
          {reportMessage}
        </p>
      ) : null}

      {isLoading ? <FeedLoadingState /> : null}
      {!isLoading && error ? <FeedErrorState onRetry={() => void refresh()} /> : null}

      {!isLoading && !error && leftNav === "saved" ? (
        <FeedSavedEventsPanel events={portal.savedEvents} city={city} />
      ) : null}

      {!isLoading && !error && leftNav !== "saved" && displayedPosts.length === 0 ? (
        filterOpen && items.length > 0 ? (
          <div className="rounded-2xl border border-dashed border-yunicity-border bg-white p-8 text-center shadow-sm">
            <p className="text-base font-semibold text-neutral-900">
              Aucune publication ne correspond à vos centres d&apos;intérêt
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
              Désactivez le filtre ou ajustez vos préférences pour voir plus de contenu local.
            </p>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="mt-4 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Désactiver le filtre
            </button>
          </div>
        ) : (
          <FeedEmptyState city={city} highlights={highlights} />
        )
      ) : null}

      {!isLoading && !error && leftNav !== "saved" && displayedPosts.length > 0 ? (
        <ul className="space-y-4" aria-label="Publications du fil local">
          {displayedPosts.map((post) => (
            <li key={post.id}>
              <FeedCard
                post={post}
                layout="mobile"
                onToggleLike={toggleLike}
                onReport={handleReport}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {nextCursor && !isLoading && !error && leftNav !== "saved" ? (
        <div className="flex justify-center pb-2">
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={() => void loadMore()}
            className="rounded-full border border-yunicity-border bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            {isLoadingMore ? "Chargement…" : FEED_LOAD_MORE_LABEL}
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <FeedAppShell rightRail={rightRail}>
      <div className="web-mobile-feed-only min-w-0 flex-1 space-y-4 px-4 pt-1">
        <FeedMobileHeader />
        <FeedMobileComposer city={city} onSubmit={handleCreate} />
        <FeedMobileStoriesRail
          profile={portal.profile}
          storyRings={portal.storyRings}
          storyShortcuts={stories}
        />
        <FeedMobileViewPills
          activeView={activeView}
          onViewChange={(view) => {
            setLeftNav(null);
            setActiveView(view);
          }}
          filterOpen={filterOpen}
          onToggleFilter={() => setFilterOpen((v) => !v)}
        />
        {filterOpen ? (
          <p className="rounded-xl bg-white px-3 py-2.5 text-xs text-neutral-500 ring-1 ring-neutral-200/90">
            {filterHint}
          </p>
        ) : null}
        {feedStates}
      </div>

      <div className="web-feed-desktop-contents">
      <FeedLeftRail
        activeView={activeView}
        leftNav={leftNav}
        onNavSelect={handleLeftNavSelect}
        interests={interests}
      />

      <div className="min-w-0 flex-1">
        <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-4 py-5 sm:px-6">
            <FeedStoriesRail items={stories} seeAllHref="/stories" />
          </div>
          <div className="px-4 sm:px-6">
            <FeedViewTabs
              activeView={activeView}
              onViewChange={(view) => {
                setLeftNav(null);
                setActiveView(view);
              }}
              filterOpen={filterOpen}
              onToggleFilter={() => setFilterOpen((v) => !v)}
            />
          </div>
          {filterOpen ? (
            <p className="border-b border-neutral-100 px-4 py-3 text-xs text-neutral-500 sm:px-6">
              {interests.length > 0 ? (
                <>
                  Filtre actif selon vos centres d&apos;intérêt :{" "}
                  {interests.slice(0, 4).join(", ")}
                  {interests.length > 4 ? "…" : ""}
                </>
              ) : (
                <>
                  Ajoutez vos centres d&apos;intérêt dans les{" "}
                  <Link href="/settings" className="font-semibold text-yunicity-primary hover:underline">
                    paramètres
                  </Link>{" "}
                  pour activer le filtrage.
                </>
              )}
            </p>
          ) : null}
        </div>

        <div id="feed-composer" ref={composerRef} className="mt-5 scroll-mt-28">
          <div className="rounded-2xl border border-neutral-200/90 bg-white px-4 shadow-sm sm:px-5">
            <FeedComposer city={city} onSubmit={handleCreate} />
          </div>
        </div>

        {!leftNav ? (
          <div className="mt-5">
            <LocalVideoTeaserSection city={city} filter={{ kind: "city" }} layout="scroll" />
          </div>
        ) : null}

        {viewHint ? (
          <p className="mt-4 text-xs leading-relaxed text-neutral-500">{viewHint}</p>
        ) : null}

        {reportMessage ? (
          <p className="mt-4 rounded-xl bg-yunicity-primary-soft px-4 py-3 text-sm text-yunicity-primary">
            {reportMessage}
          </p>
        ) : null}

        {isLoading ? <FeedLoadingState /> : null}
        {!isLoading && error ? <FeedErrorState onRetry={() => void refresh()} /> : null}

        {!isLoading && !error && leftNav === "saved" ? (
          <FeedSavedEventsPanel events={portal.savedEvents} city={city} />
        ) : null}

        {!isLoading && !error && leftNav !== "saved" && displayedPosts.length === 0 ? (
          filterOpen && items.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-yunicity-border bg-white p-8 text-center shadow-sm">
              <p className="text-base font-semibold text-neutral-900">
                Aucune publication ne correspond à vos centres d&apos;intérêt
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
                Désactivez le filtre ou ajustez vos préférences pour voir plus de contenu local.
              </p>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="mt-4 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Désactiver le filtre
              </button>
            </div>
          ) : (
            <FeedEmptyState city={city} highlights={highlights} />
          )
        ) : null}

        {!isLoading && !error && leftNav !== "saved" && displayedPosts.length > 0 ? (
          <ul className="mt-5 space-y-5 lg:space-y-6" aria-label="Publications du fil local">
            {displayedPosts.map((post) => (
              <li key={post.id}>
                <FeedCard post={post} onToggleLike={toggleLike} onReport={handleReport} />
              </li>
            ))}
          </ul>
        ) : null}

        {nextCursor && !isLoading && !error && leftNav !== "saved" ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={() => void loadMore()}
              className="rounded-full border border-yunicity-border bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              {isLoadingMore ? "Chargement…" : FEED_LOAD_MORE_LABEL}
            </button>
          </div>
        ) : null}

        <div className="mt-8 2xl:hidden">{rightRail}</div>
      </div>
      </div>
    </FeedAppShell>
  );
}
